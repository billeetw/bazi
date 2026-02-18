#!/usr/bin/env node
/**
 * 為每篇文章加入「跟李伯彥一起出來玩」連結
 */
const fs = require("fs");
const path = require("path");

const LINK = '      <p class="mt-4"><a href="https://www.facebook.com/bill17gonplay/" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/40 text-blue-300 text-sm hover:bg-blue-500/10 transition">跟李伯彥一起出來玩</a></p>\n';

const articlesDir = path.join(__dirname, "../articles");
const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".html"));

let added = 0;
for (const file of files) {
  const filepath = path.join(articlesDir, file);
  let content = fs.readFileSync(filepath, "utf8");
  if (content.includes("bill17gonplay")) {
    continue;
  }
  // 在 </div> 與 <footer 之間加入連結（article-content 的結尾）
  const pattern = /(\n    <\/div>\n\n    <footer class="mt-12 pt-8 border-t border-white\/10)/;
  if (pattern.test(content)) {
    content = content.replace(pattern, "\n" + LINK + '    </div>\n\n    <footer class="mt-12 pt-8 border-t border-white/10');
    fs.writeFileSync(filepath, content);
    added++;
    console.log("Added to", file);
  } else {
    console.warn("Pattern not found in", file);
  }
}
console.log("Done. Added to", added, "files.");
