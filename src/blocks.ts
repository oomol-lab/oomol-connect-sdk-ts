import type { OomolConnectClient } from "./client.js";
import type { ListBlocksResponse, Block } from "./types.js";

export class BlocksClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * 列出所有 blocks (默认只返回每个 package 的最新版本)
   */
  async list(options?: { includeAllVersions?: boolean }): Promise<ListBlocksResponse> {
    const response = await this.client.request<ListBlocksResponse>("/v1/blocks");

    // 为每个 block 添加组合好的 blockId 字段和版本号
    let blocks: Block[] = response.blocks.map((block) => ({
      ...block,
      blockId: `${block.package}::${block.name}`,
      version: this.extractVersion(block.path),
    }));

    // 默认只返回最新版本的 blocks
    if (!options?.includeAllVersions) {
      blocks = this.filterLatestVersions(blocks);
    }

    return { ...response, blocks };
  }

  /**
   * 从路径中提取版本号
   */
  private extractVersion(path: string): string | undefined {
    const versionMatch = path.match(/[\\/]([a-z0-9-]+)-(\d+\.\d+\.\d+)[\\/]/i);
    return versionMatch ? versionMatch[2] : undefined;
  }

  /**
   * 筛选出每个 package::name 的最新版本
   */
  private filterLatestVersions(blocks: Block[]): Block[] {
    // 按 package::name 分组
    const blockGroups = new Map<string, Block[]>();

    blocks.forEach((block) => {
      const key = `${block.package}::${block.name}`;
      if (!blockGroups.has(key)) {
        blockGroups.set(key, []);
      }
      blockGroups.get(key)!.push(block);
    });

    // 对每组选择最新版本
    const latestBlocks: Block[] = [];

    blockGroups.forEach((groupBlocks) => {
      // 按版本号排序 (降序)
      const sorted = groupBlocks.sort((a, b) => {
        const versionA = a.version || "0.0.0";
        const versionB = b.version || "0.0.0";

        const aParts = versionA.split(".").map(Number);
        const bParts = versionB.split(".").map(Number);

        for (let i = 0; i < 3; i++) {
          if (aParts[i] !== bParts[i]) return bParts[i] - aParts[i];
        }
        return 0;
      });

      // 取最新版本
      latestBlocks.push(sorted[0]);
    });

    return latestBlocks;
  }
}
