/**
 * knowledge-base/tools/upload-document.js
 *
 * Agent 工具：上传文档到知识库
 */
import path from "node:path";
import * as parser from "../lib/parser.js";
import { chunk } from "../lib/chunker.js";

export const name = "upload-document";
export const description =
  "上传文档到知识库。支持 txt、md 文件。上传后自动分块并建立全文索引，供后续 search-knowledge 检索。";

export const parameters = {
  type: "object",
  properties: {
    filePath: {
      type: "string",
      description: "文档的绝对路径",
    },
  },
  required: ["filePath"],
};

export async function execute(input, ctx) {
  const store = ctx._knowledgeBase?.store;
  if (!store) {
    return { content: [{ type: "text", text: "知识库插件未初始化" }] };
  }

  const filePath = input.filePath;

  if (!parser.supported(filePath)) {
    return {
      content: [
        {
          type: "text",
          text: `不支持的文件类型。当前支持：.txt、.md。文件：${path.basename(filePath)}`,
        },
      ],
    };
  }

  let text;
  try {
    text = parser.parse(filePath, ctx.log);
  } catch (err) {
    return {
      content: [{ type: "text", text: `文件读取失败：${err.message}` }],
    };
  }

  if (!text || text.trim().length === 0) {
    return {
      content: [{ type: "text", text: "文件内容为空，跳过上传" }],
    };
  }

  const chunkSize = ctx.config?.chunkSize ?? 512;
  const chunkOverlap = ctx.config?.chunkOverlap ?? 100;
  const chunks = chunk(text, chunkSize, chunkOverlap);

  const fileType = parser.fileType(filePath);
  const filename = path.basename(filePath);
  const result = store.addDocument(filename, fileType, filePath, chunks);

  ctx.log.info(`知识库上传: ${filename} → ${result.chunkCount} 分块`);

  return {
    content: [
      {
        type: "text",
        text: `已上传「${filename}」到知识库。\n文件类型：${fileType}\n分块数：${result.chunkCount}\n文档 ID：${result.id}`,
      },
    ],
  };
}
