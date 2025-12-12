import type { TaskInputValues, NodeInputs, InputValue } from "./types.js";

/**
 * Normalize input values format, uniformly convert to NodeInputs[] format
 */
export function normalizeInputValues(inputValues: TaskInputValues): NodeInputs[] {
  // Format 1: { input1: "value1" } → [{ nodeId: "_", inputs: [...] }]
  if (!Array.isArray(inputValues)) {
    return [{
      nodeId: "_",
      inputs: Object.entries(inputValues).map(([handle, value]) => ({ handle, value }))
    }];
  }

  // Format 2: [{ handle: "input1", value: "value1" }] → [{ nodeId: "_", inputs: [...] }]
  if (inputValues.length > 0 && "handle" in inputValues[0]) {
    return [{ nodeId: "_", inputs: inputValues as InputValue[] }];
  }

  // Format 3: [{ nodeId: "node1", inputs: [...] }] → return as is
  return inputValues as NodeInputs[];
}

/**
 * Build full URL
 */
export function buildUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${cleanBase}/${cleanPath}`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
