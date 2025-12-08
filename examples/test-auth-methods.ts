import { OomolConnectClient } from "../src/index.js";

async function testDifferentAuthMethods() {
  const baseUrl = "https://dd6994a962285240eaf0efeb628fffc62d42d3d5-frp1.fex.oomol.com/api";
  const apiKey = "api-c656404dfec3af418c6641d165c036b4b7579826bcfa4e0cf2bf6fc7d2481a97";

  console.log("=== 测试不同的认证方式 ===\n");

  // 方式1: 使用 apiToken (Bearer)
  console.log("方式1: Bearer Token (默认)");
  try {
    const client1 = new OomolConnectClient({
      baseUrl,
      apiToken: apiKey,
    });
    const { blocks } = await client1.blocks.list();
    console.log(`✓ 成功! 找到 ${blocks.length} 个 blocks\n`);
    return client1;
  } catch (error: any) {
    console.log(`✗ 失败: ${error.message}\n`);
  }

  // 方式2: X-API-Key 头
  console.log("方式2: X-API-Key 头");
  try {
    const client2 = new OomolConnectClient({
      baseUrl,
      defaultHeaders: {
        "X-API-Key": apiKey,
      },
    });
    const { blocks } = await client2.blocks.list();
    console.log(`✓ 成功! 找到 ${blocks.length} 个 blocks\n`);
    return client2;
  } catch (error: any) {
    console.log(`✗ 失败: ${error.message}\n`);
  }

  // 方式3: api-key 头
  console.log("方式3: api-key 头");
  try {
    const client3 = new OomolConnectClient({
      baseUrl,
      defaultHeaders: {
        "api-key": apiKey,
      },
    });
    const { blocks } = await client3.blocks.list();
    console.log(`✓ 成功! 找到 ${blocks.length} 个 blocks\n`);
    return client3;
  } catch (error: any) {
    console.log(`✗ 失败: ${error.message}\n`);
  }

  // 方式4: Authorization: api-key (不带 Bearer)
  console.log("方式4: Authorization 头 (不带 Bearer)");
  try {
    const client4 = new OomolConnectClient({
      baseUrl,
      defaultHeaders: {
        "Authorization": apiKey,
      },
    });
    const { blocks } = await client4.blocks.list();
    console.log(`✓ 成功! 找到 ${blocks.length} 个 blocks\n`);
    return client4;
  } catch (error: any) {
    console.log(`✗ 失败: ${error.message}\n`);
  }

  // 方式5: 不使用认证
  console.log("方式5: 无认证");
  try {
    const client5 = new OomolConnectClient({
      baseUrl,
    });
    const { blocks } = await client5.blocks.list();
    console.log(`✓ 成功! 找到 ${blocks.length} 个 blocks\n`);
    return client5;
  } catch (error: any) {
    console.log(`✗ 失败: ${error.message}\n`);
  }

  console.log("所有认证方式都失败了!");
  return null;
}

async function main() {
  // 测试不同认证方式
  const client = await testDifferentAuthMethods();

  if (!client) {
    console.error("\n无法连接到 API 服务器");
    process.exit(1);
  }

  console.log("\n=== 继续测试 audio-lab ===\n");

  try {
    // 列出所有 blocks
    const { blocks } = await client.blocks.list();
    console.log(`找到 ${blocks.length} 个 blocks:`);
    blocks.forEach((block, index) => {
      console.log(`${index + 1}. ${block.package}::${block.name}`);
      if (block.description) {
        console.log(`   描述: ${block.description}`);
      }
    });

    // 查找 audio-lab
    const audioBlocks = blocks.filter(b =>
      b.package.toLowerCase().includes("audio") ||
      b.name.toLowerCase().includes("audio") ||
      b.name.toLowerCase().includes("tts") ||
      b.name.toLowerCase().includes("speech")
    );

    if (audioBlocks.length > 0) {
      console.log(`\n找到 ${audioBlocks.length} 个音频相关的 blocks:`);
      audioBlocks.forEach(block => {
        console.log(`  - ${block.package}::${block.name}`);
        if (block.inputs) {
          console.log(`    输入参数:`);
          block.inputs.forEach(input => {
            console.log(`      - ${input.handle}`);
          });
        }
      });

      // 尝试创建任务
      const targetBlock = audioBlocks[0];
      console.log(`\n尝试使用: ${targetBlock.package}::${targetBlock.name}`);

      const { task } = await client.tasks.create({
        manifest: `${targetBlock.package}::${targetBlock.name}`,
        inputValues: {
          text: "你好,我是一只小柯基",
        },
      });

      console.log(`✓ 任务已创建: ${task.id}`);
      console.log(`  状态: ${task.status}`);

    } else {
      console.log("\n未找到音频相关的 blocks");
    }

  } catch (error: any) {
    console.error("\n✗ 错误:", error.message);
    if (error.response) {
      console.error("响应:", JSON.stringify(error.response, null, 2));
    }
  }
}

main().catch(error => {
  console.error("错误:", error);
  process.exit(1);
});
