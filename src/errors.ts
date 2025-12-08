import type { Task, InstallTask } from "./types.js";

export class OomolConnectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OomolConnectError";
  }
}

export class ApiError extends OomolConnectError {
  readonly status: number;
  readonly response?: unknown;

  constructor(message: string, status: number, response?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

export class TaskFailedError extends OomolConnectError {
  readonly taskId: string;
  readonly task: Task;

  constructor(taskId: string, task: Task) {
    super(`Task ${taskId} failed`);
    this.name = "TaskFailedError";
    this.taskId = taskId;
    this.task = task;
  }
}

export class TaskStoppedError extends OomolConnectError {
  readonly taskId: string;
  readonly task: Task;

  constructor(taskId: string, task: Task) {
    super(`Task ${taskId} was stopped`);
    this.name = "TaskStoppedError";
    this.taskId = taskId;
    this.task = task;
  }
}

export class TimeoutError extends OomolConnectError {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

export class InstallFailedError extends OomolConnectError {
  readonly taskId: string;
  readonly task: InstallTask;

  constructor(taskId: string, task: InstallTask) {
    super(`Package installation ${taskId} failed: ${task.error ?? "unknown error"}`);
    this.name = "InstallFailedError";
    this.taskId = taskId;
    this.task = task;
  }
}
