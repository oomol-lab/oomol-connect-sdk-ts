/**
 * Applets 模块使用示例
 * 演示如何列出和运行 applets
 *
 * 注意: Applets 查询使用内置的查询服务器 (https://chat-data.oomol.com)
 *       您只需要配置任务执行服务器的 baseUrl
 */
import { OomolConnectClient } from "../src/index.js";

async function main() {
  // 创建客户端 - 只需配置任务执行服务器
  // Applets 查询会自动使用内置的查询服务器
  const client = new OomolConnectClient({
    baseUrl: "https://your-task-server.com/api", // 任务执行服务器
    defaultHeaders: {
      "Authorization": "Bearer your-api-token-here",
    },
  });

  console.log("📱 正在获取 applets 列表...\n");

  try {
    // 列出所有 applets (自动使用内置查询服务器)
    const applets = await client.applets.list();

    console.log(`✅ 成功获取 ${applets.length} 个 applets:\n`);

    // 显示每个 applet 的详细信息
    applets.forEach((applet, index) => {
      console.log(`${index + 1}. Applet ID: ${applet.appletId}`);
      console.log(`   用户 ID: ${applet.userId}`);
      console.log(`   标题: ${applet.data.title || "无标题"}`);
      console.log(`   描述: ${applet.data.description || "无描述"}`);
      console.log(`   Package ID: ${applet.data.packageId}`);
      console.log(`   Block Name: ${applet.data.blockName}`);
      console.log(`   创建时间: ${new Date(applet.createdAt).toLocaleString()}`);
      console.log(`   更新时间: ${new Date(applet.updatedAt).toLocaleString()}`);

      // 如果有预设输入参数,显示它们
      if (applet.data.presetInputs) {
        console.log(`   预设输入参数:`);
        Object.entries(applet.data.presetInputs).forEach(([key, value]) => {
          console.log(`     - ${key}: ${JSON.stringify(value)}`);
        });
      }

      console.log("");
    });

    // 运行 applet 示例
    console.log("\n\n📱 运行 applet 示例...\n");

    if (applets.length > 0) {
      const appletId = applets[0].appletId;

      console.log(`正在运行 applet: ${appletId}`);
      console.log(`Block: ${applets[0].data.packageId}::${applets[0].data.blockName}`);
      console.log(`预设参数:`, applets[0].data.presetInputs);

      // 运行 applet - SDK 会自动:
      // 1. 从查询服务器获取 applet 配置
      // 2. 提取 blockId 和预设参数
      // 3. 在执行服务器上创建并运行任务
      const { result, taskId, task } = await client.applets.run(
        { appletId },
        {
          intervalMs: 2000,
          onProgress: (task) => {
            console.log(`  状态: ${task.status}`);
          }
        }
      );

      console.log(`\n✅ 任务完成!`);
      console.log(`   任务 ID: ${taskId}`);
      console.log(`   最终状态: ${task.status}`);
      console.log(`   执行结果:`, result);
    } else {
      console.log("没有可用的 applet 来运行示例");
    }

  } catch (error) {
    console.error("❌ 操作失败:", error);
    if (error instanceof Error) {
      console.error("错误信息:", error.message);
    }
  }
}

main();
