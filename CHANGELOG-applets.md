# Changelog - Applets 模块

## 版本: 0.3.0 (待发布)

### 新增功能 🎉

#### 1. Applets 模块支持

添加了完整的 Applets 模块,用于管理和运行预填参数的 blocks。

**🔧 重要改进**: Applets 查询服务器地址已内置到 SDK 中 (`https://chat-data.oomol.com`),用户只需配置任务执行服务器即可使用。

##### 1.1 数据类型定义

**AppletData 接口**:
```typescript
interface AppletData {
  title?: string;           // 可选: applet 标题
  description?: string;     // 可选: applet 描述
  id: string;               // 必需: applet 数据 ID
  createdAt: number;        // 必需: 创建时间戳
  packageId: string;        // 必需: 关联的包 ID (格式: "package-name-x.y.z")
  blockName: string;        // 必需: 关联的 block 名称
  presetInputs?: Record<string, unknown>;  // 可选: 预设输入参数
}
```

**Applet 接口**:
```typescript
interface Applet {
  appletId: string;         // 必需: applet 唯一 ID
  userId: string;           // 必需: 创建者用户 ID
  data: AppletData;         // 必需: applet 数据
  createdAt: number;        // 必需: 创建时间戳
  updatedAt: number;        // 必需: 更新时间戳
}
```

**RunAppletRequest 接口**:
```typescript
interface RunAppletRequest {
  appletId: string;                    // 必需: 要运行的 applet ID
  inputValues?: TaskInputValues;       // 可选: 用户输入参数(会覆盖预设值)
}
```

**返回类型**:
```typescript
type ListAppletsResponse = Applet[];

// run() 方法返回值与 tasks.run() 一致
interface RunAppletResponse {
  taskId: string;           // 任务 ID
  task: Task;               // 任务对象
  logs: TaskLog[];          // 任务日志
  result?: any;             // 执行结果(从日志中提取)
}
```

##### 1.2 API 端点

**listApplets** - 列出所有 applets

```
POST https://chat-data.oomol.com/rpc/listApplets
Content-Type: application/json

请求体: {}

响应: Applet[]
```

**注意**: 此端点使用内置的查询服务器地址,SDK 会自动处理,用户无需配置。

响应示例:
```json
[
  {
    "appletId": "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    "userId": "019343ac-57eb-74c9-b275-99ac294016d1",
    "data": {
      "title": "JSON 修复工具",
      "id": "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
      "createdAt": 1764685664140,
      "packageId": "json-repair-1.0.1",
      "blockName": "json-repair",
      "presetInputs": {
        "content": "{ \"a\": \"b }",
        "indent": 2,
        "preview": true
      }
    },
    "createdAt": 1764685664883,
    "updatedAt": 1764685699749
  }
]
```

##### 1.3 SDK 方法

**AppletsClient 类**:

```typescript
class AppletsClient {
  /**
   * 列出所有 applets
   * 注意: 使用内置的查询服务器 (https://chat-data.oomol.com)
   */
  async list(): Promise<Applet[]>

  /**
   * 运行 applet (预填参数的 block)
   *
   * @param request - 运行请求
   * @param pollingOptions - 轮询配置(可选)
   * @returns 任务执行结果
   */
  async run(
    request: RunAppletRequest,
    pollingOptions?: PollingOptions
  ): Promise<{
    taskId: string;
    task: Task;
    logs: TaskLog[];
    result?: any;
  }>
}
```

##### 1.4 核心实现逻辑

**run() 方法执行流程**:

```
1. 调用 list() 获取所有 applets
   ↓
2. 根据 appletId 查找目标 applet
   - 找不到 → 抛出 404 ApiError
   ↓
3. 合并预设参数和用户参数
   - 用户参数优先
   - 未提供的参数使用预设值
   ↓
4. 构造 blockId
   - 从 packageId 提取包名 (移除版本号)
   - 格式: "packageName::blockName"
   ↓
5. 调用 tasks.run() 执行任务
   ↓
6. 返回执行结果
```

**参数合并规则**:

```typescript
// 示例
presetInputs = {
  content: "{ \"a\": \"b\" }",
  indent: 2,
  preview: true
}

userInputValues = {
  content: "{ \"new\": \"value\" }",
  indent: 4
}

// 合并结果
mergedInputs = {
  content: "{ \"new\": \"value\" }",  // 用户值
  indent: 4,                          // 用户值
  preview: true                       // 预设值
}
```

**PackageId 处理**:

```typescript
// 从 packageId 提取包名
packageId: "json-repair-1.0.1"  →  packageName: "json-repair"
packageId: "ffmpeg-0.4.3"       →  packageName: "ffmpeg"

// 构造 blockId
blockId = `${packageName}::${blockName}`
// 例如: "json-repair::json-repair"
```

##### 1.5 使用示例

**TypeScript 示例**:

```typescript
import { OomolConnectClient } from "oomol-connect-sdk";

// 只需配置任务执行服务器
// Applets 查询会自动使用内置的查询服务器 (https://chat-data.oomol.com)
const client = new OomolConnectClient({
  baseUrl: "https://your-task-server.com/api",
  defaultHeaders: {
    "Authorization": "Bearer your-token"
  }
});

// 列出所有 applets (自动使用内置查询服务器)
const applets = await client.applets.list();
console.log(`找到 ${applets.length} 个 applets`);

// 运行 applet (使用所有预设参数)
const { result, taskId } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9"
});

// 运行 applet (覆盖部分参数)
const { result, task } = await client.applets.run({
  appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
  inputValues: {
    content: "{ \"new\": \"data\" }",
    indent: 4
    // preview 使用预设值
  }
});

// 运行 applet (带进度回调)
const { result, logs } = await client.applets.run(
  {
    appletId: "84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    inputValues: { content: "test" }
  },
  {
    intervalMs: 2000,
    onProgress: (task) => console.log(`状态: ${task.status}`),
    onLog: (log) => console.log(`日志:`, log)
  }
);
```

**Python SDK 参考实现**:

```python
from oomol_connect_sdk import OomolConnectClient

client = OomolConnectClient(
    base_url="https://api.example.com",
    default_headers={"Authorization": "Bearer your-token"}
)

# 列出所有 applets
applets = client.applets.list()
print(f"找到 {len(applets)} 个 applets")

# 运行 applet (使用所有预设参数)
result = client.applets.run(
    applet_id="84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9"
)

# 运行 applet (覆盖部分参数)
result = client.applets.run(
    applet_id="84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    input_values={
        "content": '{ "new": "data" }',
        "indent": 4
        # preview 使用预设值
    }
)

# 运行 applet (带进度回调)
def on_progress(task):
    print(f"状态: {task.status}")

def on_log(log):
    print(f"日志: {log}")

result = client.applets.run(
    applet_id="84dc8cac-7f91-4bd1-a3b6-6715bf4f81c9",
    input_values={"content": "test"},
    polling_options={
        "interval_ms": 2000,
        "on_progress": on_progress,
        "on_log": on_log
    }
)
```

### 实现细节 🔧

#### 错误处理

**Applet 不存在**:
```typescript
// 抛出 404 错误
throw new ApiError(
  `Applet not found: ${appletId}`,
  404,
  null
)
```

Python 等价:
```python
raise ApiError(
    f"Applet not found: {applet_id}",
    status_code=404,
    response=None
)
```

#### 辅助方法

**1. mergeInputValues** - 参数合并

```typescript
private mergeInputValues(
  presetInputs?: Record<string, unknown>,
  userInputs?: TaskInputValues
): TaskInputValues {
  if (!presetInputs || Object.keys(presetInputs).length === 0) {
    return userInputs || {};
  }

  if (!userInputs) {
    return presetInputs;
  }

  const normalizedUserInputs = this.normalizeToObject(userInputs);

  return {
    ...presetInputs,
    ...normalizedUserInputs
  };
}
```

**2. normalizeToObject** - 格式规范化

支持三种 `TaskInputValues` 格式:

```typescript
// 格式 1: 对象格式
{ input1: "value1", input2: 123 }

// 格式 2: InputValue 数组
[{ handle: "input1", value: "value1" }]

// 格式 3: NodeInputs 数组 (仅取第一个节点)
[{ nodeId: "node1", inputs: [{ handle: "input1", value: "value1" }] }]

// 统一转换为对象格式用于合并
```

**3. extractPackageName** - 提取包名

```typescript
private extractPackageName(packageId: string): string {
  // 移除 "-x.y.z" 版本号
  return packageId.replace(/-\d+\.\d+\.\d+$/, '');
}
```

示例:
```
"json-repair-1.0.1" → "json-repair"
"ffmpeg-0.4.3"      → "ffmpeg"
"zip-0.0.11"        → "zip"
```

### Python SDK 升级指南 📋

#### 1. 添加类型定义

在 `types.py` 中添加:

```python
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

@dataclass
class AppletData:
    id: str
    created_at: int
    package_id: str
    block_name: str
    title: Optional[str] = None
    description: Optional[str] = None
    preset_inputs: Optional[Dict[str, Any]] = None

@dataclass
class Applet:
    applet_id: str
    user_id: str
    data: AppletData
    created_at: int
    updated_at: int

@dataclass
class RunAppletRequest:
    applet_id: str
    input_values: Optional[TaskInputValues] = None
```

#### 2. 创建 AppletsClient

在 `applets.py` 中创建:

```python
from typing import List, Optional, Dict, Any
import re

class AppletsClient:
    def __init__(self, client):
        self._client = client

    def list(self) -> List[Applet]:
        """列出所有 applets"""
        response = self._client.request(
            "/rpc/listApplets",
            method="POST",
            json={}
        )
        return [Applet(**applet) for applet in response]

    def run(
        self,
        applet_id: str,
        input_values: Optional[TaskInputValues] = None,
        polling_options: Optional[PollingOptions] = None
    ) -> Dict[str, Any]:
        """运行 applet"""
        # 1. 查找 applet
        applets = self.list()
        applet = next((a for a in applets if a.applet_id == applet_id), None)

        if not applet:
            raise ApiError(
                f"Applet not found: {applet_id}",
                status_code=404
            )

        # 2. 合并参数
        merged_inputs = self._merge_input_values(
            applet.data.preset_inputs,
            input_values
        )

        # 3. 构造 blockId
        package_name = self._extract_package_name(applet.data.package_id)
        block_id = f"{package_name}::{applet.data.block_name}"

        # 4. 调用 tasks.run()
        return self._client.tasks.run(
            block_id=block_id,
            input_values=merged_inputs,
            polling_options=polling_options
        )

    def _merge_input_values(
        self,
        preset_inputs: Optional[Dict[str, Any]],
        user_inputs: Optional[TaskInputValues]
    ) -> TaskInputValues:
        """合并预设参数和用户参数"""
        if not preset_inputs:
            return user_inputs or {}

        if not user_inputs:
            return preset_inputs

        normalized_user_inputs = self._normalize_to_object(user_inputs)

        return {**preset_inputs, **normalized_user_inputs}

    def _normalize_to_object(self, input_values: TaskInputValues) -> Dict[str, Any]:
        """将 TaskInputValues 规范化为对象格式"""
        if isinstance(input_values, dict):
            return input_values

        if isinstance(input_values, list):
            if len(input_values) > 0:
                # 格式 2: [{ handle: "input1", value: "value1" }]
                if "handle" in input_values[0]:
                    return {item["handle"]: item["value"] for item in input_values}

                # 格式 3: [{ nodeId: "node1", inputs: [...] }]
                if "nodeId" in input_values[0]:
                    first_node = input_values[0]
                    return {
                        item["handle"]: item["value"]
                        for item in first_node["inputs"]
                    }

        return {}

    def _extract_package_name(self, package_id: str) -> str:
        """从 packageId 提取包名 (移除版本号)"""
        return re.sub(r'-\d+\.\d+\.\d+$', '', package_id)
```

#### 3. 集成到主客户端

在 `client.py` 中:

```python
from .applets import AppletsClient

class OomolConnectClient:
    def __init__(self, ...):
        # ... 其他初始化代码
        self.applets = AppletsClient(self)
```

#### 4. 导出类型

在 `__init__.py` 中:

```python
from .types import (
    Applet,
    AppletData,
    RunAppletRequest,
    # ... 其他类型
)

from .applets import AppletsClient
```

### 测试用例 🧪

```python
import pytest

def test_list_applets(client):
    """测试列出 applets"""
    applets = client.applets.list()
    assert isinstance(applets, list)
    if len(applets) > 0:
        assert hasattr(applets[0], 'applet_id')
        assert hasattr(applets[0], 'data')
        assert hasattr(applets[0].data, 'package_id')

def test_run_applet_with_preset_inputs(client):
    """测试使用预设参数运行 applet"""
    applets = client.applets.list()
    if len(applets) > 0:
        result = client.applets.run(applet_id=applets[0].applet_id)
        assert 'taskId' in result
        assert 'result' in result

def test_run_applet_with_override_inputs(client):
    """测试覆盖参数运行 applet"""
    applets = client.applets.list()
    if len(applets) > 0:
        result = client.applets.run(
            applet_id=applets[0].applet_id,
            input_values={"content": "test"}
        )
        assert 'taskId' in result

def test_run_nonexistent_applet(client):
    """测试运行不存在的 applet"""
    with pytest.raises(ApiError) as exc_info:
        client.applets.run(applet_id="nonexistent-id")
    assert exc_info.value.status_code == 404
```

### 关键变更总结 📌

1. ✅ 新增 `AppletsClient` 类
2. ✅ 新增 `list()` 方法 - 列出所有 applets
3. ✅ 新增 `run()` 方法 - 运行 applet
4. ✅ 新增类型: `Applet`, `AppletData`, `RunAppletRequest`
5. ✅ 新增 API 端点: `POST /rpc/listApplets`
6. ✅ 参数合并逻辑 - 用户参数优先
7. ✅ PackageId 处理 - 自动移除版本号

### 兼容性说明 ⚠️

- 这是一个向后兼容的新增功能
- 不影响现有的 blocks, tasks, packages 模块
- 无破坏性变更

---

**更新时间**: 2024-01-02
**贡献者**: SDK Team
