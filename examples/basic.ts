import { OomolConnectClient } from "../src/index.js";

async function main() {
  // 创建客户端
  const client = new OomolConnectClient({
    baseUrl: "http://localhost:3000/api",
  });

  console.log("=== 基础使用示例 ===\n");

  // 1. 列出所有 flows
  console.log("1. 列出所有 flows:");
  const { flows } = await client.flows.list();
  console.log(`找到 ${flows.length} 个 flows`);
  flows.forEach(flow => {
    console.log(`  - ${flow.name}: ${flow.description || "无描述"}`);
  });

  // 2. 列出所有 blocks
  console.log("\n2. 列出所有 blocks:");
  const { blocks } = await client.blocks.list();
  console.log(`找到 ${blocks.length} 个 blocks`);
  blocks.forEach(block => {
    console.log(`  - ${block.package}::${block.name}: ${block.description || "无描述"}`);
  });

  // 3. 创建任务 (使用对象格式的 inputValues)
  console.log("\n3. 创建任务:");
  const { task } = await client.tasks.create({
    manifest: "flow-1",
    inputValues: { input1: "value1", input2: 123 },
  });
  console.log(`任务已创建: ${task.id}`);
  console.log(`状态: ${task.status}`);

  // 4. 获取任务详情
  console.log("\n4. 获取任务详情:");
  const { task: taskDetail } = await client.tasks.get(task.id);
  console.log(`任务 ${taskDetail.id}:`);
  console.log(`  状态: ${taskDetail.status}`);
  console.log(`  项目ID: ${taskDetail.project_id}`);
  console.log(`  创建时间: ${new Date(taskDetail.created_at).toLocaleString()}`);

  // 5. 列出所有任务
  console.log("\n5. 列出所有任务:");
  const { tasks } = await client.tasks.list();
  console.log(`总共 ${tasks.length} 个任务`);
  tasks.slice(0, 5).forEach(t => {
    console.log(`  - ${t.id}: ${t.status}`);
  });

  // 6. 列出已安装的包
  console.log("\n6. 列出已安装的包:");
  const { packages } = await client.packages.list();
  console.log(`已安装 ${packages.length} 个包`);
  packages.forEach(pkg => {
    console.log(`  - ${pkg.name}@${pkg.version}`);
  });
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
