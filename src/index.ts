// Main client
export { OomolConnectClient } from "./client.js";

// Sub-clients
export { BlocksClient } from "./blocks.js";
export { TasksClient } from "./tasks.js";
export { PackagesClient } from "./packages.js";
export { AppletsClient } from "./applets.js";

// Types
export type {
  // Common types
  TaskStatus,
  InputHandle,
  InputValue,
  NodeInputs,
  // Blocks types
  Block,
  ListBlocksResponse,
  // Tasks types
  Task,
  ListTasksResponse,
  CreateTaskResponse,
  GetTaskResponse,
  TaskLog,
  GetTaskLogsResponse,
  // Applets types
  Applet,
  AppletData,
  ListAppletsResponse,
  RunAppletRequest,
  // Packages types
  Package,
  ListPackagesResponse,
  PackageDependency,
  InstallTaskStatus,
  InstallTask,
  InstallPackageResponse,
  ListInstallTasksResponse,
  GetInstallTaskResponse,
  // Error types
  ApiErrorResponse,
  // Input value types
  TaskInputValues,
  CreateTaskRequest,
  // Polling configuration types
  PollingOptions,
  // Client configuration
  ClientOptions,
} from "./types.js";

// Enums
export { BackoffStrategy } from "./types.js";

// Error classes
export {
  OomolConnectError,
  ApiError,
  TaskFailedError,
  TaskStoppedError,
  TimeoutError,
  InstallFailedError,
} from "./errors.js";

// Utility functions
export { normalizeInputValues, buildUrl } from "./utils.js";
