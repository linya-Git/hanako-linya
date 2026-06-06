/**
 * knowledge-base/lib/parser.js
 *
 * 文档解析：支持 txt、md，后续扩展 pdf
 */
import fs from "node:fs";
import path from "node:path";

const SUPPORTED_TYPES = new Set([".txt", ".md", ".markdown"]);

export function supported(filePath) {
  return SUPPORTED_TYPES.has(path.extname(filePath).toLowerCase());
}

export function fileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".md":
    case ".markdown":
      return "markdown";
    case ".txt":
      return "text";
    default:
      return "unknown";
  }
}

/**
 * 解析文件内容，返回纯文本
 */
export function parse(filePath, log) {
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_TYPES.has(ext)) {
    throw new Error(`不支持的文件类型: ${ext}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");

  if (ext === ".md" || ext === ".markdown") {
    return stripMarkdown(raw);
  }

  return raw;
}

/**
 * 简易 Markdown 转纯文本
 * 移除标题标记、链接、代码块、图片等格式化语法
 */
function stripMarkdown(text) {
  return text
    // 代码块
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, "").replace(/```/g, ""))
    // 行内代码
    .replace(/`([^`]+)`/g, "$1")
    // 图片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // 链接
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // 标题
    .replace(/^#{1,6}\s+/gm, "")
    // 粗体/斜体
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    // 列表标记
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // 水平线
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // 块引用
    .replace(/^>\s?/gm, "")
    // 多余空行
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
