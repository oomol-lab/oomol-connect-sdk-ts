import type { OomolConnectClient } from "./client.js";
import type {
  ListPackagesResponse,
  InstallPackageResponse,
  ListInstallTasksResponse,
  GetInstallTaskResponse,
  InstallTask,
  PollingOptions,
  BackoffStrategy,
} from "./types.js";
import { InstallFailedError, TimeoutError } from "./errors.js";

export class PackagesClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出已安装的包
   */
  async list(): Promise<ListPackagesResponse> {
    return this.client.request<ListPackagesResponse>("/packages");
  }

  /**
   * 安装包
   */
  async install(name: string, version: string): Promise<InstallPackageResponse> {
    return this.client.request<InstallPackageResponse>("/packages/install", {
      method: "POST",
      body: JSON.stringify({ name, version }),
    });
  }

  /**
   * 列出所有安装任务
   */
  async listInstallTasks(): Promise<ListInstallTasksResponse> {
    return this.client.request<ListInstallTasksResponse>("/packages/install");
  }

  /**
   * 获取安装任务状态
   */
  async getInstallTask(taskId: string): Promise<GetInstallTaskResponse> {
    return this.client.request<GetInstallTaskResponse>(`/packages/install/${encodeURIComponent(taskId)}`);
  }

  /**
   * 轮询等待安装完成
   */
  async waitForInstallCompletion(
    taskId: string,
    options: Omit<PollingOptions, "onLog"> = {}
  ): Promise<InstallTask> {
    const {
      intervalMs = 2000,
      timeoutMs,
      maxIntervalMs = 10000,
      backoffStrategy = "exponential" as BackoffStrategy,
      backoffFactor = 1.5,
      onProgress,
      signal,
    } = options;

    const startTime = Date.now();
    let currentInterval = intervalMs;
    let attempt = 0;

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
        if (aborted) throw new TimeoutError("Install polling was cancelled or timed out");

        if (timeoutMs && Date.now() - startTime > timeoutMs) {
          throw new TimeoutError(`Install polling exceeded ${timeoutMs}ms`);
        }

        const response = await this.getInstallTask(taskId);

        if (!response.success || !response.task) {
          throw new Error(`Failed to get install task: ${response.error || "unknown error"}`);
        }

        const task = response.task;

        if (task.status === "success") {
          return task;
        }
        if (task.status === "failed") {
          throw new InstallFailedError(taskId, task);
        }

        if (onProgress) {
          onProgress(task as any);
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
   * 安装并等待完成 (便捷方法)
   */
  async installAndWait(
    name: string,
    version: string,
    options?: Omit<PollingOptions, "onLog">
  ): Promise<{ taskId: string; task: InstallTask }> {
    const response = await this.install(name, version);

    if (!response.success || !response.taskId) {
      throw new Error(`Failed to install package: ${response.error || "unknown error"}`);
    }

    const task = await this.waitForInstallCompletion(response.taskId, options);
    return { taskId: response.taskId, task };
  }
}
