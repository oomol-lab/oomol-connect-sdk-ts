import { OomolConnectClient } from "../src/index.js";

async function testTextToAudio() {
  console.log("=== 测试 audio-lab 文字生成语音 ===\n");

  // 使用正确的认证方式:直接传 API key,不带 Bearer 前缀
  const client = new OomolConnectClient({
    baseUrl: "https://dd6994a962285240eaf0efeb628fffc62d42d3d5-frp1.fex.oomol.com/api",
    defaultHeaders: {
      "Authorization": "api-c656404dfec3af418c6641d165c036b4b7579826bcfa4e0cf2bf6fc7d2481a97",
    },
  });

  try {
    // 步骤1: 获取 audio-lab::text-to-audio 的详细信息
    console.log("1. 获取 audio-lab::text-to-audio 信息...");
    const { blocks } = await client.blocks.list();
    const audioBlock = blocks.find(b => b.package === "audio-lab" && b.name === "text-to-audio");

    if (!audioBlock) {
      throw new Error("未找到 audio-lab::text-to-audio block");
    }

    console.log(`✓ 找到 block: ${audioBlock.package}::${audioBlock.name}`);
    if (audioBlock.description) {
      console.log(`  描述: ${audioBlock.description}`);
    }

    // 查看输入参数
    if (audioBlock.inputs && audioBlock.inputs.length > 0) {
      console.log(`  输入参数 (${audioBlock.inputs.length} 个):`);
      audioBlock.inputs.forEach(input => {
        console.log(`    - ${input.handle}`);
        if (input.json_schema) {
          console.log(`      schema:`, JSON.stringify(input.json_schema, null, 2).replace(/\n/g, "\n      "));
        }
      });
    }

    // 步骤2: 创建任务
    console.log("\n2. 创建文字转语音任务...");
    console.log(`   文本: "你好,我是一只小柯基"`);

    const { task, userID } = await client.tasks.create({
      manifest: "audio-lab::text-to-audio",
      inputValues: {
        text: "你好,我是一只小柯基",
      },
    });

    console.log(`✓ 任务已创建!`);
    console.log(`  任务ID: ${task.id}`);
    console.log(`  状态: ${task.status}`);
    console.log(`  用户ID: ${userID}`);
    console.log(`  创建时间: ${new Date(task.created_at).toLocaleString()}`);

    // 步骤3: 轮询等待任务完成
    console.log("\n3. 等待任务完成 (可能需要几秒到几分钟)...");

    const completedTask = await client.tasks.waitForCompletion(task.id, {
      intervalMs: 2000,
      timeoutMs: 180000, // 3分钟超时
      onProgress: (task) => {
        const elapsed = ((task.updated_at - task.created_at) / 1000).toFixed(1);
        console.log(`  [进度] 状态: ${task.status} (已用时 ${elapsed}s)`);
      },
      onLog: (log) => {
        if (log.event && typeof log.event === 'object') {
          const eventStr = JSON.stringify(log.event);
          console.log(`  [日志] ${log.type} - ${log.node_id}: ${eventStr.substring(0, 100)}`);
        } else {
          console.log(`  [日志] ${log.type} - ${log.node_id}`);
        }
      },
    });

    console.log("\n✓ 任务完成!");
    console.log(`  最终状态: ${completedTask.status}`);
    console.log(`  总用时: ${((completedTask.updated_at - completedTask.created_at) / 1000).toFixed(1)}秒`);

    // 步骤4: 获取完整日志
    console.log("\n4. 获取任务输出...");
    const { logs } = await client.tasks.getLogs(task.id);

    console.log(`共 ${logs.length} 条日志记录`);

    // 查找输出相关的日志
    const outputLogs = logs.filter(log =>
      log.type.includes("output") ||
      log.type.includes("result") ||
      log.type.includes("success") ||
      (log.event && typeof log.event === 'object' && (
        'output' in log.event ||
        'result' in log.event ||
        'file' in log.event ||
        'url' in log.event ||
        'audio' in log.event
      ))
    );

    if (outputLogs.length > 0) {
      console.log("\n输出相关日志:");
      outputLogs.forEach(log => {
        console.log(`  [${log.type}]`, JSON.stringify(log.event, null, 2));
      });
    }

    // 显示所有日志
    console.log("\n5. 完整日志:");
    logs.forEach((log, index) => {
      console.log(`\n  日志 ${index + 1}/${logs.length}:`);
      console.log(`    时间: ${new Date(log.created_at).toLocaleString()}`);
      console.log(`    类型: ${log.type}`);
      console.log(`    节点: ${log.node_id}`);
      console.log(`    事件:`, JSON.stringify(log.event, null, 2).replace(/\n/g, "\n    "));
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

    throw error;
  }
}

testTextToAudio().catch(error => {
  console.error("\n程序异常退出");
  process.exit(1);
});
