# OOMOL Connect SDK

一个用于与 OOMOL Connect API 交互的 TypeScript SDK,提供完整的类型支持和现代化的 API 设计。

## 特性

- ✨ **零依赖** - 使用原生 `fetch` API,轻量且高效
- 🔒 **完整类型支持** - 基于 OpenAPI schema 生成的 TypeScript 类型
- 🎯 **模块化设计** - 清晰的功能分离,易于使用和维护
- ⚡ **轮询机制** - 内置任务轮询,支持指数退避和固定间隔策略
- 📦 **文件上传** - 支持单文件和多文件上传
- 🛠️ **灵活的输入格式** - 支持三种不同的 `inputValues` 格式
- 🔄 **便捷方法** - 提供 `createAndWait`、`installAndWait` 等便捷方法
- 🚫 **完善的错误处理** - 自定义错误类层次结构

## 安装

```bash
npm install oomol-connect-sdk
```

## 快速开始

### 基础使用

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

// 创建客户端
const client = new OomolConnectClient({
  baseUrl: "http://localhost:3000/api",
});

// 列出所有 flows
const { flows } = await client.flows.list();
console.log(flows);

// 创建任务
const { task } = await client.tasks.create({
  manifest: "flow-1",
  inputValues: { input1: "value1", input2: 123 },
});
console.log(`任务已创建: ${task.id}`);
```

### 使用 API Token 鉴权

SDK 支持多种鉴权方式，根据 API 服务器的要求选择合适的方式：

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

// 方式1: 使用 apiToken 参数 (自动添加 Bearer 前缀)
const client = new OomolConnectClient({
  baseUrl: "https://api.example.com/api",
  apiToken: "your-api-token-here",  // 会自动转换为 "Authorization: Bearer <token>"
});

// 方式2: 使用原始 API Key (不带 Bearer 前缀)
// 某些 API 可能需要直接传递 API key,不带 Bearer 前缀
const client = new OomolConnectClient({
  baseUrl: "https://api.example.com/api",
  defaultHeaders: {
    "Authorization": "api-c656404dfec3af418c6641d165c036b4b7579826bcfa4e0cf2bf6fc7d2481a97",
  },
});

// 方式3: 使用自定义请求头
const client = new OomolConnectClient({
  baseUrl: "https://api.example.com/api",
  defaultHeaders: {
    "X-API-Key": "your-api-key-here",
    "X-Custom-Auth": "custom-value",
  },
});
```

> **注意**: 不同的 API 服务器可能使用不同的鉴权方式。如果使用 `apiToken` 参数遇到 401/403 错误，请尝试直接在 `defaultHeaders` 中设置 `Authorization` 头（不带 Bearer 前缀）。

## API 模块

SDK 提供了四个主要模块:

### 1. Flows 模块

管理 flows (流程):

```typescript
// 列出所有 flows
const { flows } = await client.flows.list();
```

### 2. Blocks 模块

管理 blocks (区块):

```typescript
// 列出所有 blocks
const { blocks } = await client.blocks.list();
```

### 3. Tasks 模块

管理任务 (核心功能):

```typescript
// 列出所有任务
const { tasks } = await client.tasks.list();

// 创建任务
const { task } = await client.tasks.create({
  manifest: "flow-1",
  inputValues: { input1: "value1" },
});

// 获取任务详情
const { task: detail } = await client.tasks.get(taskId);

// 停止任务
await client.tasks.stop(taskId);

// 获取任务日志
const { logs } = await client.tasks.getLogs(taskId);
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

### 任务轮询

SDK 提供了强大的任务轮询功能,支持进度回调和日志流:

```typescript
import { BackoffStrategy } from "oomol-connect-sdk";

// 方法1: 手动轮询
const { task } = await client.tasks.create({
  manifest: "flow-1",
  inputValues: { input1: "value1" },
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
    manifest: "flow-1",
    inputValues: { input1: "value1" },
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
  "pkg-1::block-1",
  { input1: "value1" },
  file
);

// 多文件上传
const files = [file1, file2, file3];
const { task } = await client.tasks.createWithFiles(
  "pkg-1::block-1",
  { input1: "value1" },
  files
);

// 上传并等待完成
const { taskId, task } = await client.tasks.createWithFilesAndWait(
  "pkg-1::block-1",
  { input1: "value1" },
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
  manifest: "flow-1",
  inputValues: {
    input1: "value1",
    input2: 123,
  },
});

// 格式2: 数组格式
await client.tasks.create({
  manifest: "flow-1",
  inputValues: [
    { handle: "input1", value: "value1" },
    { handle: "input2", value: 123 },
  ],
});

// 格式3: 节点格式 (用于多节点)
await client.tasks.create({
  manifest: "flow-1",
  inputValues: [
    {
      nodeId: "node1",
      inputs: [
        { handle: "input1", value: "value1" },
        { handle: "input2", value: 123 },
      ],
    },
    {
      nodeId: "node2",
      inputs: [
        { handle: "input3", value: "value3" },
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
    manifest: "flow-1",
    inputValues: { input1: "value" },
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

  /** API Token (会自动添加到 Authorization 头作为 Bearer token) */
  apiToken?: string;

  /** 自定义 fetch 实现 */
  fetch?: typeof fetch;

  /** 默认请求头 (会与 apiToken 生成的头合并) */
  defaultHeaders?: Record<string, string>;
}
```

**说明:**
- `apiToken`: 最简单的鉴权方式,SDK 会自动将其添加为 `Authorization: Bearer <token>`
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

- [basic.ts](./examples/basic.ts) - 基础使用示例
- [authentication.ts](./examples/authentication.ts) - API Token 鉴权示例
- [polling.ts](./examples/polling.ts) - 轮询等待示例
- [with-files.ts](./examples/with-files.ts) - 文件上传示例
- [packages.ts](./examples/packages.ts) - 包管理示例
- [test-text-to-audio.ts](./examples/test-text-to-audio.ts) - Audio Lab 文字转语音示例

### 实际使用案例: Audio Lab 文字转语音

以下是一个完整的实际使用案例，演示如何使用 SDK 调用 audio-lab 的文字转语音功能：

```typescript
import { OomolConnectClient } from "../src/index.js";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",
  },
});

// 1. 查找 audio-lab::text-to-audio block
const { blocks } = await client.blocks.list();
const audioBlock = blocks.find(b =>
  b.package === "audio-lab" && b.name === "text-to-audio"
);

// 2. 创建文字转语音任务
const { task } = await client.tasks.create({
  manifest: "audio-lab::text-to-audio",
  inputValues: {
    text: "你好,我是一只小柯基",
  },
});

// 3. 等待任务完成并实时显示进度
const completedTask = await client.tasks.waitForCompletion(task.id, {
  intervalMs: 2000,
  timeoutMs: 180000,  // 3分钟超时
  onProgress: (task) => {
    const elapsed = ((task.updated_at - task.created_at) / 1000).toFixed(1);
    console.log(`[进度] 状态: ${task.status} (已用时 ${elapsed}s)`);
  },
  onLog: (log) => {
    console.log(`[日志] ${log.type} - ${log.node_id}`);
  },
});

// 4. 获取生成的音频文件路径
const { logs } = await client.tasks.getLogs(task.id);
const outputLog = logs.find(log =>
  log.type === "BlockFinished" && log.event?.result?.audio_address
);

console.log(`音频文件: ${outputLog.event.result.audio_address}`);
// 输出: /oomol-driver/oomol-storage/1765206844.mp3
```

**测试结果**:

- ✅ 任务创建成功
- ✅ 状态轮询正常 (created → running → completed)
- ✅ 总用时: 5.3 秒
- ✅ 成功生成音频文件
- ✅ 实时日志流正常工作

查看完整代码: [test-text-to-audio.ts](./examples/test-text-to-audio.ts)

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
