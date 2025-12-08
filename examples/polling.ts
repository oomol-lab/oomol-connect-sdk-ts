import { OomolConnectClient, BackoffStrategy } from "../src/index.js";

async function main() {
  const client = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
  });

  console.log("=== 轮询等待任务完成示例 ===\n");

  // 方法1: 手动创建任务,然后轮询
  console.log("方法1: 手动创建 + 轮询");
  const { task } = await client.tasks.create({
    manifest: "flow-1",
    inputValues: { input1: "value1" },
  });
  console.log(`任务已创建: ${task.id}`);

  try {
    const completedTask = await client.tasks.waitForCompletion(task.id, {
      intervalMs: 2000,
      timeoutMs: 300000, // 5分钟超时
      backoffStrategy: BackoffStrategy.Exponential,
      onProgress: (task) => {
        console.log(`  [进度] 任务 ${task.id}: ${task.status}`);
      },
      onLog: (log) => {
        console.log(`  [日志] ${log.type} - 节点 ${log.node_id}:`, log.event);
      },
    });
    console.log(`任务完成! 状态: ${completedTask.status}`);
  } catch (error) {
    console.error("任务失败:", error);
  }

  // 方法2: 使用便捷方法 createAndWait
  console.log("\n方法2: 使用 createAndWait 便捷方法");
  try {
    const { taskId, task: finalTask } = await client.tasks.createAndWait(
      {
        manifest: "flow-2",
        inputValues: [
          { handle: "input1", value: "test" },
          { handle: "input2", value: 456 },
        ],
      },
      {
        intervalMs: 1000,
        backoffStrategy: BackoffStrategy.Fixed, // 使用固定间隔
        onProgress: (task) => {
          console.log(`  [进度] ${task.status} (更新于 ${new Date(task.updated_at).toLocaleString()})`);
        },
      }
    );
    console.log(`任务 ${taskId} 完成! 最终状态: ${finalTask.status}`);
  } catch (error) {
    console.error("任务失败:", error);
  }

  // 方法3: 使用 AbortSignal 取消轮询
  console.log("\n方法3: 使用 AbortSignal 取消轮询");
  const abortController = new AbortController();

  // 5秒后取消
  setTimeout(() => {
    console.log("  5秒后手动取消任务轮询...");
    abortController.abort();
  }, 5000);

  try {
    const { taskId } = await client.tasks.createAndWait(
      {
        manifest: "long-running-flow",
        inputValues: { input1: "value" },
      },
      {
        intervalMs: 1000,
        signal: abortController.signal,
        onProgress: (task) => {
          console.log(`  [进度] ${task.status}`);
        },
      }
    );
    console.log(`任务 ${taskId} 完成`);
  } catch (error: any) {
    if (error.name === "TimeoutError") {
      console.log("  任务轮询已取消");
    } else {
      console.error("错误:", error);
    }
  }
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
