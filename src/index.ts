// 主客户端
export { OomolConnectClient } from "./client.js";

// 子客户端
export { BlocksClient } from "./blocks.js";
export { TasksClient } from "./tasks.js";
export { PackagesClient } from "./packages.js";

// 类型
export type {
  // 通用类型
  TaskStatus,
  InputHandle,
  InputValue,
  NodeInputs,
  // Blocks 类型
  Block,
  ListBlocksResponse,
  // Tasks 类型
  Task,
  ListTasksResponse,
  CreateTaskResponse,
  GetTaskResponse,
  TaskLog,
  GetTaskLogsResponse,
  // Packages 类型
  Package,
  ListPackagesResponse,
  PackageDependency,
  InstallTaskStatus,
  InstallTask,
  InstallPackageResponse,
  ListInstallTasksResponse,
  GetInstallTaskResponse,
  // 错误类型
  ApiErrorResponse,
  // 输入值类型
  TaskInputValues,
  CreateTaskRequest,
  // 轮询配置类型
  PollingOptions,
  // 客户端配置
  ClientOptions,
} from "./types.js";

// 枚举
export { BackoffStrategy } from "./types.js";

// 错误类
export {
  OomolConnectError,
  ApiError,
  TaskFailedError,
  TaskStoppedError,
  TimeoutError,
  InstallFailedError,
} from "./errors.js";

// 工具函数
export { normalizeInputValues, buildUrl } from "./utils.js";
