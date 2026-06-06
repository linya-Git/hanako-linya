# Hanako-linya

基于 [Hanako](https://github.com/liliMozi/openhanako) 的多智能体协同工作系统，对标 Coze（扣子）打造本地化 AI 智能体平台。

## 路线图

| 版本 | 目标 | 对标 Coze 能力 | 状态 |
|------|------|---------------|------|
| v0.0.1 | 基础架构 | Agent 人格、插件框架、技能系统、记忆分层 | ✅ |
| v0.1.0 | 知识库 | 文档上传、分块存储、全文检索、Agent 召回 | ✅ |
| v0.2.0 | 工作流 | 节点编排、条件分支、Agent 调用链 | 🔜 |
| v0.3.0 | 插件市场 | 插件注册发现、多平台连接器 | 🔜 |

## 核心能力

```
Agent 人格       → identity / ishiki / yuan 三层人格模板
插件系统         → 可扩展插件架构（image-gen、MCP、knowledge-base）
技能生态         → skills2set 技能注册与分发
记忆分层         → 短期对话记忆 + 长期经验库 + 置顶记忆
知识库           → 文档上传 → 自动分块 → FTS5 全文检索 → Agent 召回
多模型支持       → 内置多 provider 模型配置
桌面应用         → Electron 桌面端 + Node.js 服务端
```

## 目录结构

```
Hanako/
├── resources/
│   └── server/
│       ├── bundle/          # 服务端核心（打包）
│       ├── plugins/         # 插件目录
│       │   ├── image-gen/         # 图片/视频生成
│       │   ├── mcp/               # MCP 连接器
│       │   └── knowledge-base/    # 知识库
│       ├── skills2set/      # 内置技能
│       │   ├── quiet-musing/      # 深度推理框架
│       │   ├── skill-creator/     # 技能创建工具
│       │   └── user-guide/        # 用户指南
│       ├── lib/             # 配置、模型定义、人格模板
│       └── desktop/         # 前端主题、多语言
└── ...                      # Electron 运行时
```

## 技术栈

- **运行时**：Electron + Node.js (ESM)
- **存储**：better-sqlite3 + FTS5
- **插件**：自研插件总线（bus 事件 + tools 注册 + routes 挂载）
- **Agent**：pi-ai / pi-coding-agent 多 Agent 框架
- **模型接入**：OpenAI / Anthropic / AWS Bedrock / Google / Mistral 等多 provider

## 开发

```bash
# 克隆
git clone https://github.com/linya-Git/hanako-linya.git
cd hanako-linya

# 安装依赖
cd resources/server
npm install

# 启动
cd ../..
./Hanako.exe
```
