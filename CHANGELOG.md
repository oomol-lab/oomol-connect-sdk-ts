# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-12-12

### Added

- **Applets 模块**: 新增完整的 Applets 模块,用于管理和运行预填参数的 blocks
  - 新增 `AppletsClient` 类,提供 `list()` 和 `run()` 方法
  - 新增类型定义: `Applet`, `AppletData`, `RunAppletRequest`
  - Applets 查询服务器地址已内置到 SDK (`https://chat-data.oomol.com`),用户只需配置任务执行服务器
  - 支持参数合并: 用户参数优先,未提供的参数使用预设值
  - 自动处理 packageId,提取包名并构造 blockId

### Security

- **移除敏感数据**: 从 Git 历史中彻底删除了包含 API token 的测试文件
- **增强 .gitignore**: 添加规则防止未来泄露敏感数据
  - 忽略 `test-*.ts` 文件
  - 忽略 `.env.*` 环境变量文件
  - 忽略 `**/apiToken.ts` 文件

### Changed

- 优化文档和示例代码

## [0.2.0] - 2025-12-09

### Breaking Changes

- **移除 Flows 模块**: 完全移除了 `flows` 模块及其相关 API，简化了 SDK 结构
  - 移除 `client.flows` 属性
  - 移除 `FlowsClient` 类
  - 移除 `Flow`, `FlowInputNode`, `ListFlowsResponse` 类型
  - 用户现在只需关注 Blocks、Tasks 和 Packages 三个核心模块

- **字段重命名**: 将 `manifest` 字段重命名为 `blockId`，提升 API 易用性
  - `Block.manifest` → `Block.blockId`
  - `CreateTaskRequest.manifest` → `CreateTaskRequest.blockId`
  - `createWithFiles(manifest, ...)` → `createWithFiles(blockId, ...)`
  - `runWithFiles(manifest, ...)` → `runWithFiles(blockId, ...)`

### Added

- **自动生成 blockId**: `blocks.list()` 返回的每个 block 现在自动包含 `blockId` 字段（格式：`"package::name"`），用户无需手动拼接
- **版本号字段**: `blocks.list()` 返回的每个 block 现在包含 `version` 字段，自动从安装路径中提取版本号（如 `"0.1.9"`）
- **智能版本过滤**: `blocks.list()` 默认只返回每个 package 的最新版本，大幅减少返回数据量
  - 默认行为: 只返回最新版本（从 362 个减少到 132 个 blocks）
  - 可选参数: `blocks.list({ includeAllVersions: true })` 返回所有版本

### Changed

- 更新所有文档和示例代码以反映新的 API 结构
- 简化了 SDK 的概念模型，降低学习成本

### Migration Guide

#### 从 0.1.x 升级到 0.2.0

#### 1. 移除 Flows 相关代码

```typescript
// 旧版本 (0.1.x) - 不再支持
const { flows } = await client.flows.list();

// 新版本 (0.2.0) - 使用 blocks 替代
const { blocks } = await client.blocks.list();
```

#### 2. 更新字段名称

```typescript
// 旧版本 (0.1.x)
await client.tasks.create({
  manifest: "audio-lab::text-to-audio",
  inputValues: { text: "你好" }
});

// 新版本 (0.2.0)
await client.tasks.create({
  blockId: "audio-lab::text-to-audio",
  inputValues: { text: "你好" }
});
```

#### 3. 使用自动生成的 blockId 和版本号

```typescript
// 新版本 (0.2.0) - 推荐方式
const { blocks } = await client.blocks.list();

// Block 自动包含 blockId 和 version 字段
blocks.forEach(block => {
  console.log(`${block.blockId} - v${block.version}`);
  // 例如: ffmpeg::audio_video_separation - v0.1.9
});

// 使用 blockId 创建任务
await client.tasks.run({
  blockId: blocks[0].blockId,
  inputValues: { text: "你好" }
});

// 如需查看所有版本
const allBlocks = await client.blocks.list({ includeAllVersions: true });
```

## [0.1.1] - 2024-XX-XX

### Added

- 初始版本发布
- 支持 Flows、Blocks、Tasks、Packages 四个模块
- 完整的任务轮询和错误处理机制
- 支持文件上传功能

### Fixed

- 更新 API token 处理和文档

---

## Version Numbering

- **Major (X.0.0)**: Breaking changes that require code updates
- **Minor (0.X.0)**: New features, backwards compatible
- **Patch (0.0.X)**: Bug fixes, backwards compatible
