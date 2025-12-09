import { OomolConnectClient } from "../src/index.js";

async function testTextToSpeech() {
  console.log("=== 测试 audio-lab 文字生成语音 ===\n");

  // 创建客户端
  const client = new OomolConnectClient({
    baseUrl: "https://your-api-server.com/api",
    apiToken: "your-api-token-here",
  });

  try {
    // 步骤1: 列出所有 flows 和 blocks
    console.log("1. 查找 audio-lab 相关的 blocks...");
    const { blocks } = await client.blocks.list();

    console.log(`找到 ${blocks.length} 个 blocks:`);
    blocks.forEach(block => {
      console.log(`  - ${block.package}::${block.name}`);
      if (block.description) {
        console.log(`    描述: ${block.description}`);
      }
    });

    // 查找 audio-lab 的文字生成语音 block
    const audioBlock = blocks.find(b =>
      b.package.includes("audio-lab") ||
      b.name.includes("text-to-speech") ||
      b.name.includes("tts")
    );

    if (!audioBlock) {
      console.log("\n未找到 audio-lab 的文字生成语音 block");
      console.log("可用的 blocks:");
      blocks.forEach(b => console.log(`  - ${b.package}::${b.name}`));
      return;
    }

    console.log(`\n找到目标 block: ${audioBlock.package}::${audioBlock.name}`);
    console.log(`路径: ${audioBlock.path}`);

    // 步骤2: 查看 block 的输入参数
    if (audioBlock.inputs) {
      console.log("\n输入参数:");
      audioBlock.inputs.forEach(input => {
        console.log(`  - ${input.handle}:`, input.json_schema);
      });
    }

    // 步骤3: 创建任务
    console.log("\n2. 创建文字生成语音任务...");
    const manifest = `${audioBlock.package}::${audioBlock.name}`;

    const { task } = await client.tasks.create({
      manifest: manifest,
      inputValues: {
        text: "你好,我是一只小柯基",
        // 可能还需要其他参数,根据实际 API 调整
      },
    });

    console.log(`✓ 任务已创建: ${task.id}`);
    console.log(`  状态: ${task.status}`);
    console.log(`  项目ID: ${task.project_id}`);

    // 步骤4: 轮询等待任务完成
    console.log("\n3. 等待任务完成...");
    const completedTask = await client.tasks.waitForCompletion(task.id, {
      intervalMs: 2000,
      timeoutMs: 120000, // 2分钟超时
      onProgress: (task) => {
        console.log(`  [进度] 任务状态: ${task.status}`);
      },
      onLog: (log) => {
        console.log(`  [日志] ${log.type}:`, log.event);
      },
    });

    console.log("\n✓ 任务完成!");
    console.log(`最终状态: ${completedTask.status}`);
    console.log(`任务详情:`, JSON.stringify(completedTask, null, 2));

    // 步骤5: 获取任务日志
    console.log("\n4. 获取完整日志...");
    const { logs } = await client.tasks.getLogs(task.id);
    console.log(`共 ${logs.length} 条日志:`);
    logs.forEach(log => {
      console.log(`  [${log.type}] ${log.node_id}:`, log.event);
    });

  } catch (error: any) {
    console.error("\n✗ 测试失败:", error.message);
    console.error("错误类型:", error.name);

    if (error.status) {
      console.error("HTTP 状态码:", error.status);
    }

    if (error.response) {
      console.error("响应详情:", JSON.stringify(error.response, null, 2));
    }

    if (error.task) {
      console.error("任务详情:", JSON.stringify(error.task, null, 2));
    }

    // 如果是认证错误,提供帮助信息
    if (error.status === 401 || error.status === 403) {
      console.error("\n⚠️  认证失败可能的原因:");
      console.error("1. API Token 格式不正确");
      console.error("2. API Token 已过期");
      console.error("3. API Token 没有访问权限");
      console.error("4. API 服务器的认证方式配置不正确");
      console.error("\n请检查 API Token 或尝试使用不同的认证方式。");
    }
  }
}

testTextToSpeech().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
