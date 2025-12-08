import { OomolConnectClient } from "../src/index.js";
import { readFileSync } from "fs";

async function main() {
  const client = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
  });

  console.log("=== 文件上传示例 ===\n");

  // 示例1: 上传单个文件
  console.log("1. 上传单个文件:");

  // 在浏览器环境中,可以从 <input type="file"> 获取 File 对象
  // 在 Node.js 环境中,需要创建 File 对象
  const fileContent = "这是一个测试文件内容";
  const file = new File([fileContent], "test.txt", { type: "text/plain" });

  const { task } = await client.tasks.createWithFiles(
    "pkg-1::block-1",
    { input1: "value1", input2: 123 },
    file
  );

  console.log(`任务已创建: ${task.id}`);
  console.log(`状态: ${task.status}`);

  // 示例2: 上传多个文件
  console.log("\n2. 上传多个文件:");

  const file1 = new File(["文件1内容"], "file1.txt", { type: "text/plain" });
  const file2 = new File(["文件2内容"], "file2.txt", { type: "text/plain" });

  const { task: task2 } = await client.tasks.createWithFiles(
    "pkg-2::block-2",
    [
      { handle: "input1", value: "test" },
      { handle: "input2", value: 456 },
    ],
    [file1, file2]
  );

  console.log(`任务已创建: ${task2.id}`);
  console.log(`状态: ${task2.status}`);

  // 示例3: 上传文件并等待任务完成
  console.log("\n3. 上传文件并等待任务完成:");

  const file3 = new File(["重要数据"], "data.json", { type: "application/json" });

  try {
    const { taskId, task: completedTask } = await client.tasks.createWithFilesAndWait(
      "data-processing-block",
      { mode: "process", format: "json" },
      file3,
      {
        intervalMs: 2000,
        onProgress: (task) => {
          console.log(`  [进度] 任务 ${task.id}: ${task.status}`);
        },
      }
    );

    console.log(`任务 ${taskId} 完成!`);
    console.log(`最终状态: ${completedTask.status}`);
  } catch (error) {
    console.error("任务失败:", error);
  }

  // 示例4: 从本地文件系统读取文件 (Node.js)
  console.log("\n4. 从本地文件读取并上传 (Node.js):");

  try {
    // 读取本地文件
    const fileBuffer = readFileSync("./package.json");
    const localFile = new File([fileBuffer], "package.json", { type: "application/json" });

    const { task: task4 } = await client.tasks.createWithFiles(
      "file-analyzer",
      { analyze: true },
      localFile
    );

    console.log(`任务已创建: ${task4.id}`);
  } catch (error) {
    console.log("  (跳过,文件不存在)");
  }
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
