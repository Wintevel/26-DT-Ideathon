// dist-single/index.html(완전한 문서)을 Artifact용 조각으로 바꾼다: doctype/html/head/body 태그 제거
import { readFileSync, writeFileSync } from 'node:fs';
const [src, out] = process.argv.slice(2);
let h = readFileSync(src, 'utf8');
h = h.replace(/<!doctype html>/i, '')
  .replace(/<\/?html[^>]*>/gi, '')
  .replace(/<\/?head>/gi, '')
  .replace(/<\/?body>/gi, '')
  .replace(/<meta charset="UTF-8"\s*\/?>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '');
writeFileSync(out, h.trim() + '\n');
