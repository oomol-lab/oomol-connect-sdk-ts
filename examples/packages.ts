import { OomolConnectClient } from "../src/index.js";

async function main() {
  const client = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
  });

  console.log("=== 包管理示例 ===\n");

  // 1. 列出已安装的包
  console.log("1. 列出已安装的包:");
  const { packages } = await client.packages.list();
  console.log(`已安装 ${packages.length} 个包:`);
  packages.forEach(pkg => {
    console.log(`  - ${pkg.name}@${pkg.version}`);
  });

  // 2. 安装包 (不等待)
  console.log("\n2. 安装包 (异步):");
  const installResponse = await client.packages.install("my-package", "1.0.0");

  if (installResponse.success && installResponse.taskId) {
    console.log(`安装任务已创建: ${installResponse.taskId}`);

    // 手动轮询安装状态
    console.log("\n3. 轮询安装状态:");
    try {
      const completedTask = await client.packages.waitForInstallCompletion(
        installResponse.taskId,
        {
          intervalMs: 1000,
          onProgress: (task) => {
            console.log(`  [进度] 状态: ${task.status}`);
            if (task.dependencies && task.dependencies.length > 0) {
              console.log(`  依赖包: ${task.dependencies.map(d => d.name).join(", ")}`);
            }
          },
        }
      );

      console.log(`安装完成!`);
      console.log(`  包名: ${completedTask.name}`);
      console.log(`  版本: ${completedTask.version}`);
      console.log(`  路径: ${completedTask.packagePath}`);
    } catch (error) {
      console.error("安装失败:", error);
    }
  } else {
    console.error(`安装失败: ${installResponse.error}`);
  }

  // 4. 使用便捷方法: 安装并等待完成
  console.log("\n4. 使用 installAndWait 便捷方法:");
  try {
    const { taskId, task } = await client.packages.installAndWait(
      "another-package",
      "2.1.0",
      {
        intervalMs: 1000,
        timeoutMs: 120000, // 2分钟超时
        onProgress: (installTask) => {
          console.log(`  [进度] ${installTask.status}`);
        },
      }
    );

    console.log(`包安装成功!`);
    console.log(`  任务ID: ${taskId}`);
    console.log(`  包名: ${task.name}@${task.version}`);
    console.log(`  安装路径: ${task.packagePath}`);

    if (task.dependencies && task.dependencies.length > 0) {
      console.log(`  依赖包 (${task.dependencies.length}):`);
      task.dependencies.forEach(dep => {
        console.log(`    - ${dep.name}@${dep.version} (${dep.packagePath})`);
      });
    }
  } catch (error: any) {
    if (error.name === "InstallFailedError") {
      console.error(`安装失败: ${error.task.error}`);
    } else {
      console.error("错误:", error);
    }
  }

  // 5. 列出所有安装任务
  console.log("\n5. 列出所有安装任务:");
  const { success, tasks } = await client.packages.listInstallTasks();

  if (success) {
    console.log(`总共 ${tasks.length} 个安装任务:`);
    tasks.slice(0, 5).forEach(task => {
      console.log(`  - ${task.name}@${task.version || "?"}: ${task.status}`);
      if (task.error) {
        console.log(`    错误: ${task.error}`);
      }
    });
  }

  // 6. 获取特定安装任务的状态
  if (installResponse.success && installResponse.taskId) {
    console.log("\n6. 获取安装任务详情:");
    const taskResponse = await client.packages.getInstallTask(installResponse.taskId);

    if (taskResponse.success && taskResponse.task) {
      const task = taskResponse.task;
      console.log(`任务 ${task.id}:`);
      console.log(`  包名: ${task.name}`);
      console.log(`  版本: ${task.version}`);
      console.log(`  状态: ${task.status}`);
      console.log(`  创建时间: ${new Date(task.createdAt).toLocaleString()}`);
      console.log(`  更新时间: ${new Date(task.updatedAt).toLocaleString()}`);
    }
  }
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
