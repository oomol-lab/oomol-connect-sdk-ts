import type { OomolConnectClient } from "./client.js";
import type { ListBlocksResponse } from "./types.js";

export class BlocksClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出所有 blocks
   */
  async list(): Promise<ListBlocksResponse> {
    const response = await this.client.request<ListBlocksResponse>("/v1/blocks");

    // 为每个 block 添加组合好的 blockId 字段
    response.blocks = response.blocks.map((block) => ({
      ...block,
      blockId: `${block.package}::${block.name}`,
    }));

    return response;
  }
}
