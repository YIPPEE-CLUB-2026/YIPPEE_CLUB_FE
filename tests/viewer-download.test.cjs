const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('viewer fetches the coded PDF once and saves the prepared blob without another API request', async () => {
  const states = [];
  let cursor = 0;
  let mounted = false;
  let effect;
  let cleanup;
  let downloads = 0;
  let fileFetches = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useEffect(callback) { if (!mounted) effect = callback; },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/screens/ViewerPage.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const pdfUrl = 'blob:prepared-coded-pdf';
  new Function('exports', 'require', 'fetch', 'URL', code)(exports, (name) => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react-router-dom') return { useParams: () => ({ activityId: '7' }) };
    if (name === '../lib/api') return { resolveApiFileUrl: (url) => url };
    if (name === '../services/activities') return {
      getActivity: async () => ({ id: 7, title: '활동지' }),
      getDownload: async () => {
        downloads++;
        return { download_url: '/coded.pdf', file_name: 'W0007-CODE.pdf' };
      },
    };
    return { ScreenHeader: () => null, WireDialog: () => null, Icon: () => null };
  }, async () => {
    fileFetches++;
    return { ok: true, blob: async () => new Blob(['coded PDF']) };
  }, { createObjectURL: () => pdfUrl, revokeObjectURL: () => {} });
  exports.ViewerPage();
  mounted = true;
  cleanup = effect();
  await new Promise((resolve) => setImmediate(resolve));
  cursor = 0;
  const tree = exports.ViewerPage();
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    nodes.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  const save = nodes.find((node) => node.props?.['aria-label'] === '활동지 내려받기');
  assert.equal(save.type, 'a');
  assert.equal(save.props.href, pdfUrl);
  assert.equal(save.props.download, 'W0007-CODE.pdf');
  assert.equal(save.props.onClick, undefined);
  assert.equal(downloads, 1);
  assert.equal(fileFetches, 1);
  cleanup();
});
