# OOMOL Connect SDK

一个用于与 OOMOL Connect API 交互的 TypeScript SDK,提供完整的类型支持和现代化的 API 设计。

## 安装

```bash
npm install oomol-connect-sdk
```

## 快速开始

### 最简单的用法 - 直接运行任务获取结果

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",
  },
});

// 一行代码运行任务并获取结果
const { result, taskId, logs } = await client.tasks.run({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "你好,我是一只小柯基",
  },
});

console.log("任务结果:", result);
// 输出: { audio_address: "/oomol-driver/oomol-storage/1765206844.mp3" }
```

### 基础使用

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

// 创建客户端
const client = new OomolConnectClient({
  baseUrl: "http://localhost:3000/api",
});

// 列出所有 blocks
const { blocks } = await client.blocks.list();
console.log(blocks);

// 创建任务
const { task } = await client.tasks.create({
  blockId: blocks[0].blockId,
  inputValues: { input1: "value1", input2: 123 },
});
console.log(`任务已创建: ${task.id}`);
```

### 鉴权配置

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",  // 直接传入 API key
  },
});
```

> **注意**: 不同的 OOMOL API 服务器可能使用不同的鉴权方式，请根据实际情况调整 Authorization 头的格式。

## API 模块

SDK 提供了四个主要模块:

### 1. Blocks 模块

管理 blocks (区块):

```typescript
// 列出所有 blocks
const { blocks } = await client.blocks.list();

// 每个 block 包含 blockId 字段，可以直接用于创建任务
// block.blockId 格式: "package::name"
const block = blocks[0];
console.log(block.blockId); // 例如: "audio-lab::text-to-audio"

// 直接使用 blockId 创建任务
const { result } = await client.tasks.run({
  blockId: block.blockId,
  inputValues: { text: "你好" },
});
```

### 2. Tasks 模块

管理任务 (核心功能):

```typescript
// 列出所有任务
const { tasks } = await client.tasks.list();

// 创建任务
const { task } = await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: { text: "你好" },
});

// 获取任务详情
const { task: detail } = await client.tasks.get(taskId);

// 停止任务
await client.tasks.stop(taskId);

// 获取任务日志
const { logs } = await client.tasks.getLogs(taskId);
```

### 3. Applets 模块

管理小程序 (applets)。Applet 是预填了参数的 Block,运行 applet 相当于用预设参数运行对应的 block:

```typescript
// 列出所有 applets
const applets = await client.applets.list();

// 每个 applet 包含:
// - appletId: applet 的唯一 ID
// - userId: 创建者的用户 ID
// - data: applet 数据
//   - title/description: 标题和描述
//   - packageId: 关联的包 ID (如 "json-repair-1.0.1")
//   - blockName: 关联的 block 名称
//   - presetInputs: 预设输入参数
// - createdAt/updatedAt: 时间戳

console.log(applets[0].data.title);        // applet 标题
console.log(applets[0].data.packageId);    // "json-repair-1.0.1"
console.log(applets[0].data.blockName);    // "json-repair"
console.log(applets[0].data.presetInputs); // { content: "...", indent: 2 }

// 运行 applet (使用所有预设参数)
const { result, taskId } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9"
});
console.log("执行结果:", result);

// 运行 applet (覆盖部分预设参数)
// 用户提供的参数会覆盖预设值,未提供的参数使用预设值
const { result, taskId } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
  inputValues: {
    content: "{ \"new\": \"value\" }", // 覆盖预设值
    indent: 4,                         // 覆盖预设值
    // preview 字段未提供,使用预设值
  }
});

// 运行 applet (带轮询回调)
const { result, task, logs } = await client.applets.run(
  {
    appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    inputValues: { content: "new content" }
  },
  {
    intervalMs: 2000,
    onProgress: (task) => console.log(`进度: ${task.status}`),
    onLog: (log) => console.log(`日志:`, log)
  }
);
```

**参数合并规则**:

```typescript
// 预设参数
presetInputs = { content: "{ \"a\": \"b\" }", indent: 2, preview: true }

// 用户参数
inputValues = { content: "new", indent: 4 }

// 合并结果 (用户参数优先)
mergedInputs = { content: "new", indent: 4, preview: true }
```

### 4. Packages 模块

管理包安装:

```typescript
// 列出已安装的包
const { packages } = await client.packages.list();

// 安装包
const response = await client.packages.install("package-name", "1.0.0");

// 列出安装任务
const { tasks } = await client.packages.listInstallTasks();

// 获取安装任务状态
const { task } = await client.packages.getInstallTask(taskId);
```

## 高级功能

### 便捷方法 - 一步运行任务

SDK 提供了最简单的 `run()` 方法，自动完成创建任务、等待完成、获取结果的全流程：

```typescript
// 方法1: 运行任务并获取结果（推荐）
const { result, taskId, task, logs } = await client.tasks.run({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "你好,我是一只小柯基",
  },
});

console.log("任务ID:", taskId);
console.log("任务结果:", result);
// result: { audio_address: "/oomol-driver/oomol-storage/1765206844.mp3" }

// 方法2: 带文件上传的任务
const file = new File(["content"], "test.txt");
const { result, taskId } = await client.tasks.runWithFiles(
  "audio-lab::text-to-audio",
  { text: "你好" },
  file
);

// 方法3: 带进度回调
const { result } = await client.tasks.run(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: { text: "你好" },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`进度: ${task.status}`);
    },
  }
);
```

### 任务轮询

SDK 提供了强大的任务轮询功能,支持进度回调和日志流:

```typescript
import { BackoffStrategy } from "oomol-connect-sdk";

// 方法1: 手动轮询
const { task } = await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: { text: "你好" },
});

const completedTask = await client.tasks.waitForCompletion(task.id, {
  intervalMs: 2000,              // 轮询间隔
  timeoutMs: 300000,             // 5分钟超时
  maxIntervalMs: 10000,          // 最大间隔
  backoffStrategy: BackoffStrategy.Exponential,  // 指数退避
  backoffFactor: 1.5,            // 退避系数
  onProgress: (task) => {
    console.log(`任务状态: ${task.status}`);
  },
  onLog: (log) => {
    console.log(`日志: ${log.type}`, log.event);
  },
});

// 方法2: 使用便捷方法
const { taskId, task: finalTask } = await client.tasks.createAndWait(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: { text: "你好" },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`进度: ${task.status}`);
    },
  }
);
```

### 文件上传

支持单文件和多文件上传:

```typescript
// 单文件上传
const file = new File(["content"], "test.txt");
const { task } = await client.tasks.createWithFiles(
  "audio-lab::text-to-audio",
  { text: "你好" },
  file
);

// 多文件上传
const files = [file1, file2, file3];
const { task } = await client.tasks.createWithFiles(
  "audio-lab::image-processor",
  { mode: "batch" },
  files
);

// 上传并等待完成
const { taskId, task } = await client.tasks.createWithFilesAndWait(
  "audio-lab::text-to-audio",
  { text: "你好" },
  file,
  {
    intervalMs: 2000,
    onProgress: (task) => console.log(task.status),
  }
);
```

### 包管理

安装包并等待完成:

```typescript
// 安装并等待完成
const { taskId, task } = await client.packages.installAndWait(
  "my-package",
  "1.0.0",
  {
    intervalMs: 1000,
    timeoutMs: 120000,  // 2分钟超时
    onProgress: (installTask) => {
      console.log(`安装状态: ${installTask.status}`);
    },
  }
);

console.log(`安装完成: ${task.packagePath}`);
```

### 取消轮询

使用 `AbortSignal` 取消轮询:

```typescript
const abortController = new AbortController();

// 5秒后取消
setTimeout(() => abortController.abort(), 5000);

try {
  await client.tasks.waitForCompletion(taskId, {
    signal: abortController.signal,
  });
} catch (error) {
  if (error.name === "TimeoutError") {
    console.log("轮询已取消");
  }
}
```

## InputValues 格式

SDK 支持三种不同的 `inputValues` 格式:

```typescript
// 格式1: 对象格式 (最简单)
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "你好",
    voice: "default",
  },
});

// 格式2: 数组格式
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: [
    { handle: "text", value: "你好" },
    { handle: "voice", value: "default" },
  ],
});

// 格式3: 节点格式 (用于多节点)
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: [
    {
      nodeId: "node1",
      inputs: [
        { handle: "text", value: "你好" },
        { handle: "voice", value: "default" },
      ],
    },
    {
      nodeId: "node2",
      inputs: [
        { handle: "speed", value: 1.0 },
      ],
    },
  ],
});
```

## 错误处理

SDK 提供了完善的错误处理:

```typescript
import {
  ApiError,
  TaskFailedError,
  TaskStoppedError,
  TimeoutError,
  InstallFailedError,
} from "oomol-connect-sdk";

try {
  const { task } = await client.tasks.createAndWait({
    blockId: "audio-lab::text-to-audio",
    inputValues: { text: "你好" },
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`HTTP 错误 ${error.status}:`, error.message);
    console.error("响应:", error.response);
  } else if (error instanceof TaskFailedError) {
    console.error(`任务失败:`, error.task);
  } else if (error instanceof TaskStoppedError) {
    console.error(`任务已停止:`, error.task);
  } else if (error instanceof TimeoutError) {
    console.error("操作超时:", error.message);
  } else if (error instanceof InstallFailedError) {
    console.error(`包安装失败:`, error.task.error);
  } else {
    console.error("未知错误:", error);
  }
}
```

## 配置选项

### 客户端配置

```typescript
const client = new OomolConnectClient({
  baseUrl: "http://localhost:3000/api",  // API 基础 URL
  apiToken: "your-api-token",            // API Token (推荐)
  fetch: customFetch,                    // 自定义 fetch 实现
  defaultHeaders: {                      // 默认请求头
    "X-Custom-Header": "value",
  },
});
```

#### ClientOptions 接口

```typescript
interface ClientOptions {
  /** API 基础 URL, 默认 /api */
  baseUrl?: string;

  /** API Token (会自动添加到 Authorization 头) */
  apiToken?: string;

  /** 自定义 fetch 实现 */
  fetch?: typeof fetch;

  /** 默认请求头 (会与 apiToken 生成的头合并) */
  defaultHeaders?: Record<string, string>;
}
```

**说明:**

- `apiToken`: 最简单的鉴权方式,SDK 会自动将其添加为 `Authorization` 头
- `defaultHeaders`: 可以覆盖或添加任何自定义请求头
- 如果同时提供 `apiToken` 和 `defaultHeaders.Authorization`,`defaultHeaders` 的值会覆盖 `apiToken`

### 轮询配置

```typescript
interface PollingOptions {
  intervalMs?: number;              // 轮询间隔 (默认 2000ms)
  timeoutMs?: number;               // 超时时间 (默认无限制)
  maxIntervalMs?: number;           // 最大间隔 (默认 10000ms)
  backoffStrategy?: BackoffStrategy; // 退避策略 (默认 Exponential)
  backoffFactor?: number;           // 退避系数 (默认 1.5)
  onProgress?: (task: Task) => void; // 进度回调
  onLog?: (log: TaskLog) => void;   // 日志回调
  signal?: AbortSignal;             // 取消信号
}
```

## 示例代码

查看 [examples](./examples/) 目录获取更多示例:

- [simple-run.ts](./examples/simple-run.ts) - 最简单的运行示例（推荐）
- [basic.ts](./examples/basic.ts) - 基础使用示例
- [polling.ts](./examples/polling.ts) - 轮询等待示例
- [with-files.ts](./examples/with-files.ts) - 文件上传示例
- [packages.ts](./examples/packages.ts) - 包管理示例
- [test-text-to-audio.ts](./examples/test-text-to-audio.ts) - 完整的测试示例

### 实际使用案例: Audio Lab 文字转语音

以下是一个完整的实际使用案例，演示如何使用 SDK 调用 audio-lab 的文字转语音功能：

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",
  },
});

// 使用 run 方法 - 一步完成所有操作
const { result, taskId, task } = await client.tasks.run(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: {
      text: "你好,我是一只小柯基",
    },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`进度: ${task.status}`);
    },
  }
);

console.log(`音频文件: ${result.audio_address}`);
// 输出: /oomol-driver/oomol-storage/1765207389.mp3
```

**测试结果**:

- ✅ 任务创建成功
- ✅ 状态轮询正常 (created → running → completed)
- ✅ 总用时: 5.3 秒
- ✅ 成功生成音频文件
- ✅ 自动返回结果对象

查看完整代码: [simple-run.ts](./examples/simple-run.ts)

## TypeScript 支持

SDK 完全使用 TypeScript 编写,提供完整的类型定义:

```typescript
import type {
  Task,
  Flow,
  Block,
  Package,
  TaskLog,
  PollingOptions,
  ClientOptions,
} from "oomol-connect-sdk";
```

## 浏览器和 Node.js 支持

SDK 使用原生 `fetch` API,支持:

- **浏览器**: 所有现代浏览器
- **Node.js**: 18+ (原生支持 `fetch`)

## API 文档

完整的 API 文档请参考 OpenAPI schema。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request!
