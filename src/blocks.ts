import type { OomolConnectClient } from "./client.js";
import type { ListBlocksResponse } from "./types.js";

export class BlocksClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出所有 blocks
   */
  async list(): Promise<ListBlocksResponse> {
    return this.client.request<ListBlocksResponse>("/v1/blocks");
  }
}
