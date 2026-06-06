/**
 * knowledge-base/lib/chunker.js
 *
 * 文本分块：固定窗口 + 重叠
 */

/**
 * 将文本按字符数分块
 * @param {string} text - 原始文本
 * @param {number} chunkSize - 每块字符数（默认 512）
 * @param {number} overlap - 相邻块重叠字符数（默认 100）
 * @returns {string[]}
 */
export function chunk(text, chunkSize = 512, overlap = 100) {
  if (!text || text.trim().length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // 尽量在句末或段末截断
    if (end < text.length) {
      const slice = text.slice(start, end + overlap);
      const breakPoints = [
        slice.lastIndexOf("\n\n"),  // 优先段末
        slice.lastIndexOf("。"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf("."),
        slice.lastIndexOf("！"),
        slice.lastIndexOf("？"),
        slice.lastIndexOf(" "),
      ];

      for (const bp of breakPoints) {
        if (bp > chunkSize * 0.5) {
          end = start + bp + 1;
          break;
        }
      }
    }

    chunks.push(text.slice(start, Math.min(end, text.length)).trim());
    start = end - overlap;
  }

  return chunks.filter((c) => c.length > 0);
}
