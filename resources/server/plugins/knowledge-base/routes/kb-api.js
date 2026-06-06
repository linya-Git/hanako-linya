/**
 * knowledge-base/routes/kb-api.js
 *
 * REST API：文档管理
 */
export default function (app, ctx) {
  const getStore = () => ctx._knowledgeBase?.store;

  // 上传文档
  app.post("/kb/documents", async (c) => {
    const store = getStore();
    if (!store) return c.json({ error: "knowledge base not initialized" }, 503);

    try {
      const body = await c.req.json();
      const { filePath } = body;

      if (!filePath) {
        return c.json({ error: "filePath is required" }, 400);
      }

      const { parse, supported, fileType } = await import("../lib/parser.js");
      const { chunk } = await import("../lib/chunker.js");
      const path = await import("node:path");

      if (!supported(filePath)) {
        return c.json({ error: "unsupported file type" }, 400);
      }

      const text = parse(filePath, ctx.log);
      if (!text?.trim()) {
        return c.json({ error: "empty file" }, 400);
      }

      const chunkSize = ctx.config?.chunkSize ?? 512;
      const chunkOverlap = ctx.config?.chunkOverlap ?? 100;
      const chunks = chunk(text, chunkSize, chunkOverlap);
      const filename = path.default.basename(filePath);
      const type = fileType(filePath);
      const result = store.addDocument(filename, type, filePath, chunks);

      return c.json(result);
    } catch (err) {
      return c.json({ error: err.message }, 500);
    }
  });

  // 搜索
  app.get("/kb/search", (c) => {
    const store = getStore();
    if (!store) return c.json({ error: "knowledge base not initialized" }, 503);

    const query = c.req.query("q");
    const limit = parseInt(c.req.query("limit") || "5");

    if (!query) return c.json({ error: "q is required" }, 400);

    const results = store.search(query, limit);
    return c.json({ results });
  });

  // 文档列表
  app.get("/kb/documents", (c) => {
    const store = getStore();
    if (!store) return c.json({ error: "knowledge base not initialized" }, 503);

    const docs = store.listDocuments();
    return c.json({ documents: docs });
  });

  // 删除文档
  app.delete("/kb/documents/:id", (c) => {
    const store = getStore();
    if (!store) return c.json({ error: "knowledge base not initialized" }, 503);

    const id = c.req.param("id");
    store.removeDocument(id);
    return c.json({ ok: true });
  });

  // 统计
  app.get("/kb/stats", (c) => {
    const store = getStore();
    if (!store) return c.json({ error: "knowledge base not initialized" }, 503);

    return c.json(store.stats());
  });
}
