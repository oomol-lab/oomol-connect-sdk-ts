import type { OomolConnectClient } from "./client.js";
import type { ListBlocksResponse, Block } from "./types.js";

export class BlocksClient {
  constructor(private client: OomolConnectClient) {}

  /**
   * List all blocks (by default only returns the latest version of each package)
   */
  async list(options?: { includeAllVersions?: boolean }): Promise<ListBlocksResponse> {
    const response = await this.client.request<ListBlocksResponse>("/v1/blocks");

    // Add composed blockId field and version number to each block
    let blocks: Block[] = response.blocks.map((block) => ({
      ...block,
      blockId: `${block.package}::${block.name}`,
      version: this.extractVersion(block.path),
    }));

    // By default only return the latest version of blocks
    if (!options?.includeAllVersions) {
      blocks = this.filterLatestVersions(blocks);
    }

    return { ...response, blocks };
  }

  /**
   * Extract version number from path
   */
  private extractVersion(path: string): string | undefined {
    const versionMatch = path.match(/[\\/]([a-z0-9-]+)-(\d+\.\d+\.\d+)[\\/]/i);
    return versionMatch ? versionMatch[2] : undefined;
  }

  /**
   * Filter out the latest version of each package::name
   */
  private filterLatestVersions(blocks: Block[]): Block[] {
    // Group by package::name
    const blockGroups = new Map<string, Block[]>();

    blocks.forEach((block) => {
      const key = `${block.package}::${block.name}`;
      if (!blockGroups.has(key)) {
        blockGroups.set(key, []);
      }
      blockGroups.get(key)!.push(block);
    });

    // Select the latest version for each group
    const latestBlocks: Block[] = [];

    blockGroups.forEach((groupBlocks) => {
      // Sort by version number (descending)
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

      // Take the latest version
      latestBlocks.push(sorted[0]);
    });

    return latestBlocks;
  }
}
