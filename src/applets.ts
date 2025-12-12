import type { OomolConnectClient } from "./client.js";
import type { ListAppletsResponse, RunAppletRequest, TaskInputValues, InputValue, NodeInputs, PollingOptions, Task, TaskLog } from "./types.js";
import { ApiError } from "./errors.js";

// Fixed server address for Applets queries
const APPLETS_QUERY_BASE_URL = "https://chat-data.oomol.com";

export class AppletsClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * List all applets
   * Note: This method uses a fixed query server (https://chat-data.oomol.com)
   */
  async list(): Promise<ListAppletsResponse> {
    // Use fixed query server address
    const url = `${APPLETS_QUERY_BASE_URL}/rpc/listApplets`;
    const headers: Record<string, string> = {
      ...this.client.getDefaultHeaders(),
      "Content-Type": "application/json",
    };

    const response = await this.client.getFetch()(url, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        try {
          errorBody = await response.text();
        } catch {
          errorBody = null;
        }
      }
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<ListAppletsResponse>;
  }

  /**
   * Run applet (block with pre-filled parameters)
   */
  async run(
    request: RunAppletRequest,
    pollingOptions?: PollingOptions
  ): Promise<{
    taskId: string;
    task: Task;
    logs: TaskLog[];
    result?: any;
  }> {
    // Step 1: Find applet from list()
    const applets = await this.list();
    const applet = applets.find(a => a.appletId === request.appletId);

    // Step 2: If not found, throw error
    if (!applet) {
      throw new ApiError(
        `Applet not found: ${request.appletId}`,
        404,
        null
      );
    }

    // Step 3: Merge preset parameters with user parameters
    const mergedInputs = this.mergeInputValues(
      applet.data.presetInputs,
      request.inputValues
    );

    // Step 4: Construct blockId
    const packageName = this.extractPackageName(applet.data.packageId);
    const blockId = `${packageName}::${applet.data.blockName}`;

    // Step 5: Call tasks.run()
    return await this.client.tasks.run({
      blockId,
      inputValues: mergedInputs
    }, pollingOptions);
  }

  /**
   * Merge preset parameters with user parameters (user parameters take precedence)
   */
  private mergeInputValues(
    presetInputs?: Record<string, unknown>,
    userInputs?: TaskInputValues
  ): TaskInputValues {
    // If no preset values, return user input directly
    if (!presetInputs || Object.keys(presetInputs).length === 0) {
      return userInputs || {};
    }

    // If no user input, return preset values
    if (!userInputs) {
      return presetInputs;
    }

    // Normalize user input to object format
    const normalizedUserInputs = this.normalizeToObject(userInputs);

    // Merge: user input overrides preset values
    return {
      ...presetInputs,
      ...normalizedUserInputs
    };
  }

  /**
   * Normalize the three TaskInputValues formats to object format
   */
  private normalizeToObject(inputValues: TaskInputValues): Record<string, unknown> {
    // Format 1: Object format, return directly
    if (!Array.isArray(inputValues)) {
      return inputValues;
    }

    // Format 2: [{ handle: "input1", value: "value1" }]
    if (inputValues.length > 0 && "handle" in inputValues[0]) {
      const result: Record<string, unknown> = {};
      (inputValues as InputValue[]).forEach(item => {
        result[item.handle] = item.value;
      });
      return result;
    }

    // Format 3: [{ nodeId: "node1", inputs: [...] }]
    // Only supports single node, takes the first node's inputs
    const nodeInputs = inputValues as NodeInputs[];
    if (nodeInputs.length > 0) {
      const result: Record<string, unknown> = {};
      nodeInputs[0].inputs.forEach(item => {
        result[item.handle] = item.value;
      });
      return result;
    }

    return {};
  }

  /**
   * Extract package name from packageId (remove version number)
   */
  private extractPackageName(packageId: string): string {
    // packageId format: "json-repair-1.0.1" or "json-repair"
    // Remove "-x.y.z" version suffix
    return packageId.replace(/-\d+\.\d+\.\d+$/, '');
  }
}
