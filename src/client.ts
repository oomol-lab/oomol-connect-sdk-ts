import type { ClientOptions } from "./types.js";
import { ApiError } from "./errors.js";
import { buildUrl } from "./utils.js";
import { BlocksClient } from "./blocks.js";
import { TasksClient } from "./tasks.js";
import { PackagesClient } from "./packages.js";
import { AppletsClient } from "./applets.js";

export class OomolConnectClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  public readonly blocks: BlocksClient;
  public readonly tasks: TasksClient;
  public readonly packages: PackagesClient;
  public readonly applets: AppletsClient;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "/api";
    this.fetchFn = options.fetch ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};

    // If apiToken is provided, automatically add it to Authorization header
    if (options.apiToken) {
      this.defaultHeaders["Authorization"] = options.apiToken;
    }

    this.blocks = new BlocksClient(this);
    this.tasks = new TasksClient(this);
    this.packages = new PackagesClient(this);
    this.applets = new AppletsClient(this);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = buildUrl(this.baseUrl, path);
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(init.headers as Record<string, string> || {}),
    };

    // If JSON body, automatically add Content-Type
    if (init.body && typeof init.body === "string") {
      headers["Content-Type"] = "application/json";
    }

    const response = await this.fetchFn(url, { ...init, headers });

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

    return response.json() as Promise<T>;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getFetch(): typeof fetch {
    return this.fetchFn;
  }

  getDefaultHeaders(): Record<string, string> {
    return this.defaultHeaders;
  }
}
