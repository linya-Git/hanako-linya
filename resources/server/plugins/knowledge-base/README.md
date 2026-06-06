# Knowledge Base Plugin

对标 Coze 知识库功能：文档上传、自动分块、全文检索、Agent 对话中知识召回。

## 功能

| 功能 | 说明 |
|------|------|
| 文档上传 | 支持 `.txt`、`.md`，自动解析为纯文本 |
| 智能分块 | 固定窗口 + 滑动重叠，优先在句末/段末截断 |
| 全文检索 | SQLite FTS5 + BM25 排序，支持中文分词 |
| Agent 工具 | `upload-document` / `search-knowledge`，对话中直接调用 |
| REST API | 上传、搜索、列表、删除、统计 |

## Agent 使用示例

```
// 上传文档
调用 upload-document，filePath: /path/to/产品手册.md

// 对话中检索
调用 search-knowledge，query: 退款流程怎么处理
```

## REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/kb/documents` | 上传文档 `{ filePath }` |
| GET | `/kb/search?q=xxx&limit=5` | 全文检索 |
| GET | `/kb/documents` | 文档列表 |
| DELETE | `/kb/documents/:id` | 删除文档 |
| GET | `/kb/stats` | 统计信息 |

## Bus 事件

| 事件 | 说明 |
|------|------|
| `kb:search` | `{ query, limit }` → `{ results }` |
| `kb:list-documents` | → `{ documents }` |
| `kb:stats` | → `{ documentCount, chunkCount }` |
| `kb:remove-document` | `{ id }` → `{ ok }` |

## 配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `chunkSize` | 512 | 分块字符数 |
| `chunkOverlap` | 100 | 相邻分块重叠字符数 |
| `maxSearchResults` | 5 | 最大搜索结果数 |

## 技术栈

- **存储**：better-sqlite3 + FTS5 全文索引
- **分块**：滑动窗口 + 自然断句
- **检索**：BM25 排序 + LIKE 降级兜底
