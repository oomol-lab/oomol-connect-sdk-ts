# OOMOL Connect SDK

[中文文档](./README.zh-CN.md) | English

A TypeScript SDK for interacting with OOMOL Connect API, providing complete type support and modern API design.

## Installation

```bash
npm install oomol-connect-sdk
```

## Quick Start

### Simplest Usage - Run Task and Get Result

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",
  },
});

// Run task and get result in one line
const { result, taskId, logs } = await client.tasks.run({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "Hello, I'm a little corgi",
  },
});

console.log("Task result:", result);
// Output: { audio_address: "/oomol-driver/oomol-storage/1765206844.mp3" }
```

### Basic Usage

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

// Create client
const client = new OomolConnectClient({
  baseUrl: "http://localhost:3000/api",
});

// List all blocks
const { blocks } = await client.blocks.list();
console.log(blocks);

// Create task
const { task } = await client.tasks.create({
  blockId: blocks[0].blockId,
  inputValues: { input1: "value1", input2: 123 },
});
console.log(`Task created: ${task.id}`);
```

### Authentication Configuration

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",  // Pass API key directly
  },
});
```

> **Note**: Different OOMOL API servers may use different authentication methods. Please adjust the Authorization header format according to your actual situation.

## API Modules

The SDK provides four main modules:

### 1. Blocks Module

Manage blocks:

```typescript
// List all blocks
const { blocks } = await client.blocks.list();

// Each block contains blockId field, which can be used directly to create tasks
// block.blockId format: "package::name"
const block = blocks[0];
console.log(block.blockId); // Example: "audio-lab::text-to-audio"

// Use blockId directly to create task
const { result } = await client.tasks.run({
  blockId: block.blockId,
  inputValues: { text: "Hello" },
});
```

### 2. Tasks Module

Manage tasks (core functionality):

```typescript
// List all tasks
const { tasks } = await client.tasks.list();

// Create task
const { task } = await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: { text: "Hello" },
});

// Get task details
const { task: detail } = await client.tasks.get(taskId);

// Stop task
await client.tasks.stop(taskId);

// Get task logs
const { logs } = await client.tasks.getLogs(taskId);
```

### 3. Applets Module

Manage applets. An Applet is a Block with pre-filled parameters. Running an applet is equivalent to running the corresponding block with preset parameters:

```typescript
// List all applets
const applets = await client.applets.list();

// Each applet contains:
// - appletId: unique ID of the applet
// - userId: creator's user ID
// - data: applet data
//   - title/description: title and description
//   - packageId: associated package ID (e.g., "json-repair-1.0.1")
//   - blockName: associated block name
//   - presetInputs: preset input parameters
// - createdAt/updatedAt: timestamps

console.log(applets[0].data.title);        // applet title
console.log(applets[0].data.packageId);    // "json-repair-1.0.1"
console.log(applets[0].data.blockName);    // "json-repair"
console.log(applets[0].data.presetInputs); // { content: "...", indent: 2 }

// Run applet (using all preset parameters)
const { result, taskId } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9"
});
console.log("Execution result:", result);

// Run applet (override some preset parameters)
// User-provided parameters will override preset values, unprovided parameters use preset values
const { result, taskId } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
  inputValues: {
    content: "{ \"new\": \"value\" }", // Override preset value
    indent: 4,                         // Override preset value
    // preview field not provided, uses preset value
  }
});

// Run applet (with polling callbacks)
const { result, task, logs } = await client.applets.run(
  {
    appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    inputValues: { content: "new content" }
  },
  {
    intervalMs: 2000,
    onProgress: (task) => console.log(`Progress: ${task.status}`),
    onLog: (log) => console.log(`Log:`, log)
  }
);
```

**Parameter Merging Rules**:

```typescript
// Preset parameters
presetInputs = { content: "{ \"a\": \"b\" }", indent: 2, preview: true }

// User parameters
inputValues = { content: "new", indent: 4 }

// Merged result (user parameters take precedence)
mergedInputs = { content: "new", indent: 4, preview: true }
```

### 4. Packages Module

Manage package installation:

```typescript
// List installed packages
const { packages } = await client.packages.list();

// Install package
const response = await client.packages.install("package-name", "1.0.0");

// List installation tasks
const { tasks } = await client.packages.listInstallTasks();

// Get installation task status
const { task } = await client.packages.getInstallTask(taskId);
```

## Advanced Features

### Convenient Method - Run Task in One Step

The SDK provides the simplest `run()` method that automatically completes the full workflow of creating a task, waiting for completion, and getting results:

```typescript
// Method 1: Run task and get result (recommended)
const { result, taskId, task, logs } = await client.tasks.run({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "Hello, I'm a little corgi",
  },
});

console.log("Task ID:", taskId);
console.log("Task result:", result);
// result: { audio_address: "/oomol-driver/oomol-storage/1765206844.mp3" }

// Method 2: Task with file upload
const file = new File(["content"], "test.txt");
const { result, taskId } = await client.tasks.runWithFiles(
  "audio-lab::text-to-audio",
  { text: "Hello" },
  file
);

// Method 3: With progress callback
const { result } = await client.tasks.run(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: { text: "Hello" },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`Progress: ${task.status}`);
    },
  }
);
```

### Task Polling

The SDK provides powerful task polling functionality with progress callbacks and log streaming:

```typescript
import { BackoffStrategy } from "oomol-connect-sdk";

// Method 1: Manual polling
const { task } = await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: { text: "Hello" },
});

const completedTask = await client.tasks.waitForCompletion(task.id, {
  intervalMs: 2000,              // Polling interval
  timeoutMs: 300000,             // 5 minutes timeout
  maxIntervalMs: 10000,          // Maximum interval
  backoffStrategy: BackoffStrategy.Exponential,  // Exponential backoff
  backoffFactor: 1.5,            // Backoff factor
  onProgress: (task) => {
    console.log(`Task status: ${task.status}`);
  },
  onLog: (log) => {
    console.log(`Log: ${log.type}`, log.event);
  },
});

// Method 2: Using convenient method
const { taskId, task: finalTask } = await client.tasks.createAndWait(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: { text: "Hello" },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`Progress: ${task.status}`);
    },
  }
);
```

### File Upload

Supports single and multiple file uploads:

```typescript
// Single file upload
const file = new File(["content"], "test.txt");
const { task } = await client.tasks.createWithFiles(
  "audio-lab::text-to-audio",
  { text: "Hello" },
  file
);

// Multiple files upload
const files = [file1, file2, file3];
const { task } = await client.tasks.createWithFiles(
  "audio-lab::image-processor",
  { mode: "batch" },
  files
);

// Upload and wait for completion
const { taskId, task } = await client.tasks.createWithFilesAndWait(
  "audio-lab::text-to-audio",
  { text: "Hello" },
  file,
  {
    intervalMs: 2000,
    onProgress: (task) => console.log(task.status),
  }
);
```

### Package Management

Install package and wait for completion:

```typescript
// Install and wait for completion
const { taskId, task } = await client.packages.installAndWait(
  "my-package",
  "1.0.0",
  {
    intervalMs: 1000,
    timeoutMs: 120000,  // 2 minutes timeout
    onProgress: (installTask) => {
      console.log(`Installation status: ${installTask.status}`);
    },
  }
);

console.log(`Installation completed: ${task.packagePath}`);
```

### Cancel Polling

Use `AbortSignal` to cancel polling:

```typescript
const abortController = new AbortController();

// Cancel after 5 seconds
setTimeout(() => abortController.abort(), 5000);

try {
  await client.tasks.waitForCompletion(taskId, {
    signal: abortController.signal,
  });
} catch (error) {
  if (error.name === "TimeoutError") {
    console.log("Polling cancelled");
  }
}
```

## InputValues Format

The SDK supports three different `inputValues` formats:

```typescript
// Format 1: Object format (simplest)
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: {
    text: "Hello",
    voice: "default",
  },
});

// Format 2: Array format
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: [
    { handle: "text", value: "Hello" },
    { handle: "voice", value: "default" },
  ],
});

// Format 3: Node format (for multi-node)
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: [
    {
      nodeId: "node1",
      inputs: [
        { handle: "text", value: "Hello" },
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

## Error Handling

The SDK provides comprehensive error handling:

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
    inputValues: { text: "Hello" },
  });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`HTTP error ${error.status}:`, error.message);
    console.error("Response:", error.response);
  } else if (error instanceof TaskFailedError) {
    console.error(`Task failed:`, error.task);
  } else if (error instanceof TaskStoppedError) {
    console.error(`Task stopped:`, error.task);
  } else if (error instanceof TimeoutError) {
    console.error("Operation timeout:", error.message);
  } else if (error instanceof InstallFailedError) {
    console.error(`Package installation failed:`, error.task.error);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Configuration Options

### Client Configuration

```typescript
const client = new OomolConnectClient({
  baseUrl: "http://localhost:3000/api",  // API base URL
  apiToken: "your-api-token",            // API Token (recommended)
  fetch: customFetch,                    // Custom fetch implementation
  defaultHeaders: {                      // Default headers
    "X-Custom-Header": "value",
  },
});
```

#### ClientOptions Interface

```typescript
interface ClientOptions {
  /** API base URL, defaults to /api */
  baseUrl?: string;

  /** API Token (automatically added to Authorization header) */
  apiToken?: string;

  /** Custom fetch implementation */
  fetch?: typeof fetch;

  /** Default headers (merged with headers generated from apiToken) */
  defaultHeaders?: Record<string, string>;
}
```

**Notes:**

- `apiToken`: The simplest authentication method, SDK will automatically add it as `Authorization` header
- `defaultHeaders`: Can override or add any custom headers
- If both `apiToken` and `defaultHeaders.Authorization` are provided, the value in `defaultHeaders` will override `apiToken`

### Polling Configuration

```typescript
interface PollingOptions {
  intervalMs?: number;              // Polling interval (default 2000ms)
  timeoutMs?: number;               // Timeout (default unlimited)
  maxIntervalMs?: number;           // Maximum interval (default 10000ms)
  backoffStrategy?: BackoffStrategy; // Backoff strategy (default Exponential)
  backoffFactor?: number;           // Backoff factor (default 1.5)
  onProgress?: (task: Task) => void; // Progress callback
  onLog?: (log: TaskLog) => void;   // Log callback
  signal?: AbortSignal;             // Cancel signal
}
```

## Examples

See the [examples](./examples/) directory for more examples:

- [simple-run.ts](./examples/simple-run.ts) - Simplest run example (recommended)
- [basic.ts](./examples/basic.ts) - Basic usage example
- [polling.ts](./examples/polling.ts) - Polling wait example
- [with-files.ts](./examples/with-files.ts) - File upload example
- [packages.ts](./examples/packages.ts) - Package management example
- [test-text-to-audio.ts](./examples/test-text-to-audio.ts) - Complete test example

### Real-world Use Case: Audio Lab Text-to-Speech

Here's a complete real-world use case demonstrating how to use the SDK to call audio-lab's text-to-speech functionality:

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

const client = new OomolConnectClient({
  baseUrl: "https://your-api-server.com/api",
  defaultHeaders: {
    "Authorization": "api-your-token-here",
  },
});

// Using run method - completes all operations in one step
const { result, taskId, task } = await client.tasks.run(
  {
    blockId: "audio-lab::text-to-audio",
    inputValues: {
      text: "Hello, I'm a little corgi",
    },
  },
  {
    intervalMs: 2000,
    onProgress: (task) => {
      console.log(`Progress: ${task.status}`);
    },
  }
);

console.log(`Audio file: ${result.audio_address}`);
// Output: /oomol-driver/oomol-storage/1765207389.mp3
```

**Test Results**:

- ✅ Task created successfully
- ✅ Status polling works (created → running → completed)
- ✅ Total time: 5.3 seconds
- ✅ Audio file generated successfully
- ✅ Result object returned automatically

See complete code: [simple-run.ts](./examples/simple-run.ts)

## TypeScript Support

The SDK is fully written in TypeScript and provides complete type definitions:

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

## Browser and Node.js Support

The SDK uses native `fetch` API and supports:

- **Browser**: All modern browsers
- **Node.js**: 18+ (native `fetch` support)

## API Documentation

For complete API documentation, please refer to the OpenAPI schema.

## License

MIT

## Contributing

Issues and Pull Requests are welcome!
