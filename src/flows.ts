import type { OomolConnectClient } from "./client.js";
import type { ListFlowsResponse } from "./types.js";

export class FlowsClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出所有 flows
   */
  async list(): Promise<ListFlowsResponse> {
    return this.client.request<ListFlowsResponse>("/v1/flows");
  }
}
