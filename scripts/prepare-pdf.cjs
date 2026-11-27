const fs = require('node:fs');
const path = require('node:path');

// PDF 엔진과 같은 버전의 워커·폰트 파일을 동일 출처에서 제공합니다.
const source = path.dirname(require.resolve('pdfjs-dist/package.json'));
const target = path.join(__dirname, '../public/pdfjs');
fs.mkdirSync(target, { recursive: true });
fs.copyFileSync(path.join(source, 'legacy/build/pdf.worker.min.mjs'), path.join(target, 'pdf.worker.min.mjs'));
for (const folder of ['cmaps', 'standard_fonts', 'wasm']) {
  fs.cpSync(path.join(source, folder), path.join(target, folder), { recursive: true });
}
