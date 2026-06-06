/**
 * knowledge-base/lib/store.js
 *
 * SQLite + FTS5 全文检索存储
 */
import Database from "better-sqlite3";
import path from "node:path";
import crypto from "node:crypto";

export class KBStore {
  constructor(dataDir, log) {
    const dbPath = path.join(dataDir, "knowledge-base.db");
    this.log = log;
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this._initSchema();
  }

  _initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        original_path TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        doc_id UNINDEXED,
        chunk_index UNINDEXED,
        content,
        tokenize='unicode61'
      );
    `);
  }

  /**
   * 添加文档及其所有分块
   * @returns {{ id: string, chunkCount: number }}
   */
  addDocument(filename, fileType, originalPath, chunks) {
    const id = crypto.randomUUID();
    const chunkCount = chunks.length;

    const insertDoc = this.db.prepare(
      "INSERT INTO documents (id, filename, file_type, original_path) VALUES (?, ?, ?, ?)"
    );
    const insertChunk = this.db.prepare(
      "INSERT INTO chunks_fts (doc_id, chunk_index, content) VALUES (?, ?, ?)"
    );

    const tx = this.db.transaction(() => {
      insertDoc.run(id, filename, fileType, originalPath);
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].trim()) {
          insertChunk.run(id, i, chunks[i]);
        }
      }
    });

    tx();
    return { id, chunkCount };
  }

  /**
   * 全文检索（BM25 排序）
   * @returns {Array<{ docId, chunkIndex, content, filename, score }>}
   */
  search(query, maxResults = 5) {
    // FTS5 查询语法：转义特殊字符，多词用 AND
    const sanitized = query
      .replace(/['"]/g, "")
      .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
      .trim();

    if (!sanitized) return [];

    // 用 OR 连接所有词进行全文检索
    const terms = sanitized.split(/\s+/).filter(Boolean);
    const ftsQuery = terms.map((t) => `"${t}"`).join(" OR ");

    const stmt = this.db.prepare(`
      SELECT
        c.doc_id,
        c.chunk_index,
        c.content,
        d.filename,
        bm25(chunks_fts, 0, 5, 10) AS score
      FROM chunks_fts c
      JOIN documents d ON d.id = c.doc_id
      WHERE chunks_fts MATCH ?
      ORDER BY score
      LIMIT ?
    `);

    try {
      const rows = stmt.all(ftsQuery, maxResults);
      return rows.map((r) => ({
        docId: r.doc_id,
        chunkIndex: r.chunk_index,
        content: r.content.slice(0, 1000), // 截断长内容
        filename: r.filename,
        score: r.score,
      }));
    } catch {
      // FTS 语法错误时降级为 LIKE 搜索
      return this._fallbackSearch(sanitized, maxResults);
    }
  }

  _fallbackSearch(query, maxResults) {
    const likePattern = `%${query}%`;
    const stmt = this.db.prepare(`
      SELECT
        c.doc_id,
        c.chunk_index,
        c.content,
        d.filename
      FROM chunks_fts c
      JOIN documents d ON d.id = c.doc_id
      WHERE c.content LIKE ?
      LIMIT ?
    `);
    const rows = stmt.all(likePattern, maxResults);
    return rows.map((r) => ({
      docId: r.doc_id,
      chunkIndex: r.chunk_index,
      content: r.content.slice(0, 1000),
      filename: r.filename,
      score: 0,
    }));
  }

  /**
   * 列出所有文档
   */
  listDocuments() {
    const stmt = this.db.prepare(`
      SELECT d.id, d.filename, d.file_type, d.created_at,
             (SELECT COUNT(*) FROM chunks_fts c WHERE c.doc_id = d.id) AS chunk_count
      FROM documents d
      ORDER BY d.created_at DESC
    `);
    return stmt.all();
  }

  /**
   * 删除文档及其所有分块
   */
  removeDocument(id) {
    const tx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM documents WHERE id = ?").run(id);
      this.db.prepare("DELETE FROM chunks_fts WHERE doc_id = ?").run(id);
      // FTS5 需要手动清理
      this.db.prepare("INSERT INTO chunks_fts(chunks_fts) VALUES('delete-all')").run();
    });
    tx();
  }

  /**
   * 获取文档统计
   */
  stats() {
    const docCount = this.db.prepare("SELECT COUNT(*) AS count FROM documents").get();
    const chunkCount = this.db.prepare("SELECT COUNT(*) AS count FROM chunks_fts").get();
    return {
      documentCount: docCount.count,
      chunkCount: chunkCount.count,
    };
  }

  destroy() {
    this.db.close();
  }
}
