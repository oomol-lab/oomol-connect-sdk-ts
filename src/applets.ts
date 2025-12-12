import type { OomolConnectClient } from "./client.js";
import type { ListAppletsResponse, RunAppletRequest, TaskInputValues, InputValue, NodeInputs, PollingOptions, Task, TaskLog } from "./types.js";
import { ApiError } from "./errors.js";

// Applets 查询服务器的固定地址
const APPLETS_QUERY_BASE_URL = "https://chat-data.oomol.com";

export class AppletsClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出所有 applets
   * 注意: 此方法使用固定的查询服务器 (https://chat-data.oomol.com)
   */
  async list(): Promise<ListAppletsResponse> {
    // 使用固定的查询服务器地址
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
   * 运行 applet (预填参数的 block)
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
    // 步骤1: 从 list() 中查找 applet
    const applets = await this.list();
    const applet = applets.find(a => a.appletId === request.appletId);

    // 步骤2: 如果找不到,抛出错误
    if (!applet) {
      throw new ApiError(
        `Applet not found: ${request.appletId}`,
        404,
        null
      );
    }

    // 步骤3: 合并预设参数和用户参数
    const mergedInputs = this.mergeInputValues(
      applet.data.presetInputs,
      request.inputValues
    );

    // 步骤4: 构造 blockId
    const packageName = this.extractPackageName(applet.data.packageId);
    const blockId = `${packageName}::${applet.data.blockName}`;

    // 步骤5: 调用 tasks.run()
    return await this.client.tasks.run({
      blockId,
      inputValues: mergedInputs
    }, pollingOptions);
  }

  /**
   * 合并预设参数和用户参数 (用户参数优先)
   */
  private mergeInputValues(
    presetInputs?: Record<string, unknown>,
    userInputs?: TaskInputValues
  ): TaskInputValues {
    // 如果没有预设值,直接返回用户输入
    if (!presetInputs || Object.keys(presetInputs).length === 0) {
      return userInputs || {};
    }

    // 如果没有用户输入,返回预设值
    if (!userInputs) {
      return presetInputs;
    }

    // 将用户输入规范化为对象格式
    const normalizedUserInputs = this.normalizeToObject(userInputs);

    // 合并: 用户输入覆盖预设值
    return {
      ...presetInputs,
      ...normalizedUserInputs
    };
  }

  /**
   * 将三种 TaskInputValues 格式规范化为对象格式
   */
  private normalizeToObject(inputValues: TaskInputValues): Record<string, unknown> {
    // 格式1: 对象格式,直接返回
    if (!Array.isArray(inputValues)) {
      return inputValues;
    }

    // 格式2: [{ handle: "input1", value: "value1" }]
    if (inputValues.length > 0 && "handle" in inputValues[0]) {
      const result: Record<string, unknown> = {};
      (inputValues as InputValue[]).forEach(item => {
        result[item.handle] = item.value;
      });
      return result;
    }

    // 格式3: [{ nodeId: "node1", inputs: [...] }]
    // 只支持单节点,取第一个节点的 inputs
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
   * 从 packageId 提取 package name (移除版本号)
   */
  private extractPackageName(packageId: string): string {
    // packageId 格式: "json-repair-1.0.1" 或 "json-repair"
    // 移除 "-x.y.z" 版本号部分
    return packageId.replace(/-\d+\.\d+\.\d+$/, '');
  }
}
