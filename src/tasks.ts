import type { OomolConnectClient } from "./client.js";
import type {
  ListTasksResponse,
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
  GetTaskLogsResponse,
  TaskInputValues,
  PollingOptions,
  Task,
  BackoffStrategy,
} from "./types.js";
import { TaskFailedError, TaskStoppedError, TimeoutError } from "./errors.js";
import { normalizeInputValues } from "./utils.js";

export class TasksClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * List all tasks
   */
  async list(): Promise<ListTasksResponse> {
    return this.client.request<ListTasksResponse>("/v1/tasks");
  }

  /**
   * Create task (JSON)
   */
  async create(request: CreateTaskRequest): Promise<CreateTaskResponse> {
    const body: Record<string, unknown> = {
      manifest: request.blockId,
    };

    if (request.inputValues !== undefined) {
      body.inputValues = normalizeInputValues(request.inputValues);
    }

    return this.client.request<CreateTaskResponse>("/v1/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Create task (multipart/form-data, supports file uploads)
   */
  async createWithFiles(
    blockId: string,
    inputValues: TaskInputValues,
    files: File | File[]
  ): Promise<CreateTaskResponse> {
    const formData = new FormData();
    formData.append("manifest", blockId);
    formData.append("inputValues", JSON.stringify(normalizeInputValues(inputValues)));

    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach(file => {
      formData.append("files", file);
    });

    return this.client.request<CreateTaskResponse>("/v1/tasks", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get task details
   */
  async get(taskId: string): Promise<GetTaskResponse> {
    return this.client.request<GetTaskResponse>(`/v1/tasks/${encodeURIComponent(taskId)}`);
  }

  /**
   * Stop task
   */
  async stop(taskId: string): Promise<GetTaskResponse> {
    return this.client.request<GetTaskResponse>(`/v1/tasks/${encodeURIComponent(taskId)}/stop`, {
      method: "POST",
    });
  }

  /**
   * Get task logs
   */
  async getLogs(taskId: string): Promise<GetTaskLogsResponse> {
    return this.client.request<GetTaskLogsResponse>(`/v1/tasks/${encodeURIComponent(taskId)}/logs`);
  }

  /**
   * Poll and wait for task completion
   */
  async waitForCompletion(taskId: string, options: PollingOptions = {}): Promise<Task> {
    const {
      intervalMs = 2000,
      timeoutMs,
      maxIntervalMs = 10000,
      backoffStrategy = "exponential" as BackoffStrategy,
      backoffFactor = 1.5,
      onProgress,
      onLog,
      signal,
    } = options;

    const startTime = Date.now();
    let currentInterval = intervalMs;
    let attempt = 0;
    let lastLogId = 0;

    const controller = new AbortController();
    let aborted = false;

    if (signal) {
      if (signal.aborted) aborted = true;
      signal.addEventListener("abort", () => {
        aborted = true;
        controller.abort();
      });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        aborted = true;
        controller.abort();
      }, timeoutMs);
    }

    try {
      while (true) {
        if (aborted) throw new TimeoutError("Task polling was cancelled or timed out");

        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          throw new TimeoutError(`Task polling exceeded ${timeoutMs}ms`);
        }

        const { task } = await this.get(taskId);

        if (task.status === "completed") {
          return task;
        }
        if (task.status === "failed") {
          throw new TaskFailedError(taskId, task);
        }
        if (task.status === "stopped") {
          throw new TaskStoppedError(taskId, task);
        }

        onProgress?.(task);

        if (onLog) {
          const { logs } = await this.getLogs(taskId);
          const newLogs = logs.filter(log => log.id > lastLogId);
          newLogs.forEach(log => onLog(log));
          if (newLogs.length > 0) {
            lastLogId = Math.max(...newLogs.map(l => l.id));
          }
        }

        await new Promise(resolve => setTimeout(resolve, currentInterval));

        attempt += 1;
        if (backoffStrategy === "exponential") {
          currentInterval = Math.min(
            maxIntervalMs,
            intervalMs * Math.pow(backoffFactor, attempt)
          );
        }
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Create and wait for task completion (convenience method)
   */
  async createAndWait(
    request: CreateTaskRequest,
    pollingOptions?: PollingOptions
  ): Promise<{ taskId: string; task: Task }> {
    const { task } = await this.create(request);
    const completedTask = await this.waitForCompletion(task.id, pollingOptions);
    return { taskId: task.id, task: completedTask };
  }

  /**
   * Create task with file uploads and wait for completion
   */
  async createWithFilesAndWait(
    blockId: string,
    inputValues: TaskInputValues,
    files: File | File[],
    pollingOptions?: PollingOptions
  ): Promise<{ taskId: string; task: Task }> {
    const { task } = await this.createWithFiles(blockId, inputValues, files);
    const completedTask = await this.waitForCompletion(task.id, pollingOptions);
    return { taskId: task.id, task: completedTask };
  }

  /**
   * Run task and get results directly (most convenient method)
   * Creates task, waits for completion, and gets logs all in one step
   */
  async run(
    request: CreateTaskRequest,
    pollingOptions?: PollingOptions
  ): Promise<{
    taskId: string;
    task: Task;
    logs: GetTaskLogsResponse["logs"];
    result?: any;
  }> {
    // Create and wait for task completion
    const { taskId, task } = await this.createAndWait(request, pollingOptions);

    // Get task logs
    const { logs } = await this.getLogs(taskId);

    // Try to extract result from logs
    const resultLog = logs.find(
      (log) => log.type === "BlockFinished" && log.event?.result
    );
    const result = resultLog?.event?.result;

    return { taskId, task, logs, result };
  }

  /**
   * Run task with file uploads and get results directly
   */
  async runWithFiles(
    blockId: string,
    inputValues: TaskInputValues,
    files: File | File[],
    pollingOptions?: PollingOptions
  ): Promise<{
    taskId: string;
    task: Task;
    logs: GetTaskLogsResponse["logs"];
    result?: any;
  }> {
    // Create and wait for task completion
    const { taskId, task } = await this.createWithFilesAndWait(
      blockId,
      inputValues,
      files,
      pollingOptions
    );

    // Get task logs
    const { logs } = await this.getLogs(taskId);

    // Try to extract result from logs
    const resultLog = logs.find(
      (log) => log.type === "BlockFinished" && log.event?.result
    );
    const result = resultLog?.event?.result;

    return { taskId, task, logs, result };
  }
}
