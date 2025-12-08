import type { TaskInputValues, NodeInputs, InputValue } from "./types.js";

/**
 * 规范化输入值格式,统一转换为 NodeInputs[] 格式
 */
export function normalizeInputValues(inputValues: TaskInputValues): NodeInputs[] {
  // 格式1: { input1: "value1" } → [{ nodeId: "_", inputs: [...] }]
  if (!Array.isArray(inputValues)) {
    return [{
      nodeId: "_",
      inputs: Object.entries(inputValues).map(([handle, value]) => ({ handle, value }))
    }];
  }

  // 格式2: [{ handle: "input1", value: "value1" }] → [{ nodeId: "_", inputs: [...] }]
  if (inputValues.length > 0 && "handle" in inputValues[0]) {
    return [{ nodeId: "_", inputs: inputValues as InputValue[] }];
  }

  // 格式3: [{ nodeId: "node1", inputs: [...] }] → 原样返回
  return inputValues as NodeInputs[];
}

/**
 * 构建完整的 URL
 */
export function buildUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${cleanBase}/${cleanPath}`;
}

/**
 * 睡眠指定毫秒数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
