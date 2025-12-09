import { OomolConnectClient } from "../src/index.js";

async function simpleExample() {
  console.log("=== SDK 便捷方法示例 ===\n");

  const client = new OomolConnectClient({
    baseUrl: "https://your-api-server.com/api",
    apiToken: "your-api-token-here",
  });

  try {
    console.log("运行文字转语音任务...\n");

    // 使用最简单的 run 方法 - 一步到位
    const { result, taskId, task, logs } = await client.tasks.run(
      {
        manifest: "audio-lab::text-to-audio",
        inputValues: {
          text: "你好,我是一只小柯基",
        },
      },
      {
        intervalMs: 2000,
        onProgress: (task) => {
          const elapsed = ((task.updated_at - task.created_at) / 1000).toFixed(1);
          console.log(`  [进度] ${task.status} (${elapsed}s)`);
        },
      }
    );

    console.log("\n✓ 任务完成!");
    console.log(`  任务ID: ${taskId}`);
    console.log(`  状态: ${task.status}`);
    console.log(`  日志条数: ${logs.length}`);
    console.log(`  结果:`, result);

    if (result?.audio_address) {
      console.log(`\n✓ 音频文件已生成: ${result.audio_address}`);
    }

  } catch (error: any) {
    console.error("\n✗ 错误:", error.message);
    throw error;
  }
}

simpleExample().catch(error => {
  console.error("程序异常退出");
  process.exit(1);
});
