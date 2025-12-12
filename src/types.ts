// ============ Common Types ============

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

// ============ Blocks Types ============

export interface Block {
  package: string;
  name: string;
  path: string;
  description?: string;
  inputs?: InputHandle[];
  blockId: string; // Format: "package::name"
  version?: string; // Version extracted from path (e.g., "0.1.9")
}

export interface ListBlocksResponse {
  blocks: Block[];
}

// ============ Tasks Types ============

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

// ============ Applets Types ============

export interface AppletData {
  title?: string;
  description?: string;
  id: string;
  createdAt: number;
  packageId: string;
  blockName: string;
  presetInputs?: Record<string, unknown>;
}

export interface Applet {
  appletId: string;
  userId: string;
  data: AppletData;
  createdAt: number;
  updatedAt: number;
}

export type ListAppletsResponse = Applet[];

export interface RunAppletRequest {
  appletId: string;
  inputValues?: TaskInputValues;
}

// ============ Packages Types ============

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

// ============ Error Types ============

export interface ApiErrorResponse {
  message?: string;
  error?: string | { message: string; stack?: string };
  success?: boolean;
}

// ============ Input Value Types (Flexible support for three formats) ============

export type TaskInputValues =
  | Record<string, unknown>                    // Format 1: { input1: "value1", input2: 123 }
  | InputValue[]                                // Format 2: [{ handle: "input1", value: "value1" }]
  | NodeInputs[];                               // Format 3: [{ nodeId: "node1", inputs: [...] }]

export interface CreateTaskRequest {
  blockId: string;
  inputValues?: TaskInputValues;
}

// ============ Polling Configuration Types ============

export enum BackoffStrategy {
  Fixed = "fixed",
  Exponential = "exponential",
}

export interface PollingOptions {
  /** Polling interval (ms), defaults to 2000 */
  intervalMs?: number;
  /** Maximum wait time (ms), defaults to unlimited */
  timeoutMs?: number;
  /** Maximum polling interval (ms), defaults to 10000 */
  maxIntervalMs?: number;
  /** Backoff strategy, defaults to Exponential */
  backoffStrategy?: BackoffStrategy;
  /** Backoff factor, defaults to 1.5 */
  backoffFactor?: number;
  /** Progress callback */
  onProgress?: (task: Task) => void;
  /** Log callback */
  onLog?: (log: TaskLog) => void;
  /** Cancel signal */
  signal?: AbortSignal;
}

// ============ Client Configuration ============

export interface ClientOptions {
  /** API base URL, defaults to /api */
  baseUrl?: string;
  /** API Token (automatically added to Authorization header) */
  apiToken?: string;
  /** Custom fetch implementation */
  fetch?: typeof fetch;
  /** Default headers */
  defaultHeaders?: Record<string, string>;
}
