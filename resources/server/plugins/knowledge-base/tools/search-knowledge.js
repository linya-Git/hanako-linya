/**
 * knowledge-base/tools/search-knowledge.js
 *
 * Agent 工具：搜索知识库
 */
export const name = "search-knowledge";
export const description =
  "在知识库中搜索相关文档内容。当需要查找已上传文档中的信息时使用此工具。返回最相关的文档片段。";

export const parameters = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description: "搜索查询，用自然语言描述想查找的内容",
    },
    limit: {
      type: "number",
      description: "返回结果数量上限，默认 5",
    },
  },
  required: ["query"],
};

export async function execute(input, ctx) {
  const store = ctx._knowledgeBase?.store;
  if (!store) {
    return { content: [{ type: "text", text: "知识库插件未初始化" }] };
  }

  const maxResults = Math.min(input.limit ?? 5, 20);
  const results = store.search(input.query, maxResults);

  if (results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `未在知识库中找到与「${input.query}」相关的内容。`,
        },
      ],
    };
  }

  // 汇总结果
  const stats = store.stats();
  const lines = [`知识库检索结果（共 ${stats.documentCount} 篇文档，${stats.chunkCount} 个分块）：\n`];

  for (const r of results) {
    lines.push(`---`);
    lines.push(`📄 ${r.filename}（片段 ${r.chunkIndex}，相关度 ${r.score.toFixed(2)}）`);
    lines.push(r.content);
    lines.push("");
  }

  lines.push(`共找到 ${results.length} 条相关片段。`);

  return {
    content: [{ type: "text", text: lines.join("\n") }],
    details: {
      results: results.map((r) => ({
        filename: r.filename,
        chunkIndex: r.chunkIndex,
        score: r.score,
        snippet: r.content.slice(0, 200),
      })),
    },
  };
}
