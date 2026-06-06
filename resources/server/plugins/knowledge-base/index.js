/**
 * plugins/knowledge-base/index.js
 *
 * 知识库插件入口
 * 对标 Coze Knowledge：文档上传 → 分块存储 → 全文检索 → Agent 召回
 */
import path from "node:path";
import { KBStore } from "./lib/store.js";

export default class KnowledgeBasePlugin {
  async onload() {
    const { dataDir, bus, log } = this.ctx;

    // 初始化存储
    const store = new KBStore(dataDir, log);

    // 挂载到 ctx 供 tools 和 routes 使用
    this.ctx._knowledgeBase = { store };

    // Bus：搜索
    this.register(
      bus.handle("kb:search", ({ query, limit = 5 }) => {
        return { results: store.search(query, limit) };
      })
    );

    // Bus：文档列表
    this.register(
      bus.handle("kb:list-documents", () => {
        return { documents: store.listDocuments() };
      })
    );

    // Bus：统计
    this.register(
      bus.handle("kb:stats", () => {
        return store.stats();
      })
    );

    // Bus：删除文档
    this.register(
      bus.handle("kb:remove-document", ({ id }) => {
        store.removeDocument(id);
        return { ok: true };
      })
    );

    // 清理
    this.register(() => {
      store.destroy();
      log.info("knowledge-base plugin unloaded");
    });

    log.info(`knowledge-base plugin loaded (${store.stats().chunkCount} chunks)`);
  }
}
