// ============ 通用类型 ============

export type TaskStatus = "created" | "pending" | "running" | "completed" | "failed" | "stopped";

export interface InputHandle {
  handle: string;
  json_schema?: Record<string, unknown>;
}

export interface InputValue {
  handle: string;
  value: unknown;
}

export interface NodeInputs {
  nodeId: string;
  inputs: InputValue[];
}

// ============ Blocks 类型 ============

export interface Block {
  package: string;
  name: string;
  path: string;
  description?: string;
  inputs?: InputHandle[];
  blockId: string; // 格式: "package::name"
}

export interface ListBlocksResponse {
  blocks: Block[];
}

// ============ Tasks 类型 ============

export interface Task {
  id: string;
  status: TaskStatus;
  project_id: string;
  manifest_path: string;
  inputValues?: NodeInputs[];
  created_at: number;
  updated_at: number;
}

export interface ListTasksResponse {
  tasks: Task[];
}

export interface CreateTaskResponse {
  task: Task;
  userID: string;
  success: boolean;
}

export interface GetTaskResponse {
  task: Task;
  success: boolean;
}

export interface TaskLog {
  id: number;
  project_name: string;
  session_id: string;
  node_id: string;
  manifest_path: string;
  type: string;
  event?: Record<string, unknown>;
  created_at: number;
}

export interface GetTaskLogsResponse {
  logs: TaskLog[];
  success: boolean;
}

// ============ Packages 类型 ============

export interface Package {
  name: string;
  version: string;
}

export interface ListPackagesResponse {
  packages: Package[];
}

export interface PackageDependency {
  name: string;
  version: string;
  packagePath: string;
}

export type InstallTaskStatus = "pending" | "running" | "success" | "failed";

export interface InstallTask {
  id: string;
  name: string;
  version?: string;
  status: InstallTaskStatus;
  packagePath?: string;
  dependencies?: PackageDependency[];
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface InstallPackageResponse {
  success: boolean;
  taskId?: string;
  error?: string;
}

export interface ListInstallTasksResponse {
  success: boolean;
  tasks: InstallTask[];
}

export interface GetInstallTaskResponse {
  success: boolean;
  task?: InstallTask;
  error?: string;
}

// ============ 错误类型 ============

export interface ApiErrorResponse {
  message?: string;
  error?: string | { message: string; stack?: string };
  success?: boolean;
}

// ============ 输入值类型 (灵活支持三种格式) ============

export type TaskInputValues =
  | Record<string, unknown>                    // 格式1: { input1: "value1", input2: 123 }
  | InputValue[]                                // 格式2: [{ handle: "input1", value: "value1" }]
  | NodeInputs[];                               // 格式3: [{ nodeId: "node1", inputs: [...] }]

export interface CreateTaskRequest {
  blockId: string;
  inputValues?: TaskInputValues;
}

// ============ 轮询配置类型 ============

export enum BackoffStrategy {
  Fixed = "fixed",
  Exponential = "exponential",
}

export interface PollingOptions {
  /** 轮询间隔 (ms), 默认 2000 */
  intervalMs?: number;
  /** 最大等待时间 (ms), 默认无限制 */
  timeoutMs?: number;
  /** 最大轮询间隔 (ms), 默认 10000 */
  maxIntervalMs?: number;
  /** 退避策略, 默认 Exponential */
  backoffStrategy?: BackoffStrategy;
  /** 退避系数, 默认 1.5 */
  backoffFactor?: number;
  /** 进度回调 */
  onProgress?: (task: Task) => void;
  /** 日志回调 */
  onLog?: (log: TaskLog) => void;
  /** 取消信号 */
  signal?: AbortSignal;
}

// ============ 客户端配置 ============

export interface ClientOptions {
  /** API 基础 URL, 默认 /api */
  baseUrl?: string;
  /** API Token (会自动添加到 Authorization 头) */
  apiToken?: string;
  /** 自定义 fetch 实现 */
  fetch?: typeof fetch;
  /** 默认请求头 */
  defaultHeaders?: Record<string, string>;
}
