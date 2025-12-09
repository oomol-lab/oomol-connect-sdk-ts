import { OomolConnectClient } from "../src/index.js";

async function main() {
  console.log("=== API Token 鉴权示例 ===\n");

  // 方式1: 使用 apiToken 参数 (最简单,推荐)
  console.log("方式1: 使用 apiToken 参数");
  const client1 = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    apiToken: "your-api-token-here",  // 自动添加到 Authorization 头
  });

  try {
    const { flows } = await client1.flows.list();
    console.log(`✓ 成功获取 ${flows.length} 个 flows`);
  } catch (error: any) {
    console.error("✗ 鉴权失败:", error.message);
  }

  // 方式2: 使用 Authorization 头 (直接指定)
  console.log("\n方式2: 使用 Authorization 头");
  const client2 = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    defaultHeaders: {
      "Authorization": "your-api-token-here",
    },
  });

  try {
    const { blocks } = await client2.blocks.list();
    console.log(`✓ 成功获取 ${blocks.length} 个 blocks`);
  } catch (error: any) {
    console.error("✗ 鉴权失败:", error.message);
  }

  // 方式3: 使用自定义 API Key 头
  console.log("\n方式3: 使用自定义 API Key 头");
  const client3 = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    defaultHeaders: {
      "X-API-Key": "your-api-key-here",
      "X-API-Secret": "your-api-secret-here",
    },
  });

  try {
    const { tasks } = await client3.tasks.list();
    console.log(`✓ 成功获取 ${tasks.length} 个 tasks`);
  } catch (error: any) {
    console.error("✗ 鉴权失败:", error.message);
  }

  // 方式4: 从环境变量读取 Token
  console.log("\n方式4: 从环境变量读取 Token");
  const apiToken = process.env.OOMOL_API_TOKEN || "default-token";
  const client4 = new OomolConnectClient({
    baseUrl: process.env.OOMOL_API_URL || "http://localhost:3000/api",
    apiToken: apiToken,
  });

  console.log(`使用 Token: ${apiToken.substring(0, 10)}...`);

  // 方式5: 基础认证 (Basic Auth)
  console.log("\n方式5: 基础认证 (Basic Auth)");
  const username = "admin";
  const password = "password123";
  const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

  const client5 = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    defaultHeaders: {
      "Authorization": `Basic ${basicAuth}`,
    },
  });

  console.log(`使用基础认证: ${username}:***`);

  // 方式6: 动态添加请求头 (适用于需要刷新 Token 的场景)
  console.log("\n方式6: 使用多个自定义头");
  const client6 = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    defaultHeaders: {
      "X-API-Key": "your-api-key",
      "X-Tenant-ID": "tenant-123",
      "X-User-ID": "user-456",
    },
  });

  try {
    const { packages } = await client6.packages.list();
    console.log(`✓ 成功获取 ${packages.length} 个 packages`);
  } catch (error: any) {
    console.error("✗ 鉴权失败:", error.message);
  }

  // 实际应用示例: 创建任务时使用鉴权
  console.log("\n实际应用: 创建任务");
  const authenticatedClient = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
    apiToken: "your-api-token-here",
  });

  try {
    const { task } = await authenticatedClient.tasks.create({
      manifest: "flow-1",
      inputValues: { input1: "value1" },
    });
    console.log(`✓ 任务创建成功: ${task.id}`);
    console.log(`  状态: ${task.status}`);
  } catch (error: any) {
    console.error("✗ 创建任务失败:", error.message);
  }
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
