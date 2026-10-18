import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync('lib/tracker-sources.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const {uniqueTrackerSources} = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const first = Object.freeze({url:'https://example.com/guide', title:'Guide', checkedAt:'2026-09-03'});
const references = Object.freeze([first, {url:'https://EXAMPLE.COM:443/guide', title:'Duplicate'}, {url:'https://example.com/collection', title:'Collection'}]);
assert.deepEqual(uniqueTrackerSources(references), [first, references[2]]);
assert.deepEqual(uniqueTrackerSources([]), []);
assert.deepEqual(uniqueTrackerSources([{url:'javascript:alert(1)', title:'Unsafe'}, {url:'/internal', title:'Internal'}, {url:'not a URL', title:'Broken'}]), []);

for (const game of ['deus-ex', 'witcher', 'valhalla', 'frostpunk']) {
  const file = `components/${game}-tracker.tsx`;
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let triggers = 0;
  function visit(node, inFooter = false) {
    const footer = inFooter || (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'footer');
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === 'TrackerSourcesDialog') {
      triggers++;
      assert(footer, `${game}: sources trigger must be inside the footer`);
    }
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'href') {
      let value = node.initializer;
      // GitHub Pages routes use sitePath('/route'); only literal internal paths are allowed.
      if (value && ts.isJsxExpression(value) && value.expression && ts.isCallExpression(value.expression) && value.expression.expression.getText(source) === 'sitePath' && value.expression.arguments.length === 1)
        value = value.expression.arguments[0];
      assert(value && ts.isStringLiteral(value) && /^(?:\/(?!\/)|#)/.test(value.text), `${game}: external references belong only in the shared sources dialog`);
    }
    if (ts.isJsxText(node)) assert(!/https?:\/\//i.test(node.text), `${game}: no visible raw source URLs`);
    ts.forEachChild(node, child => visit(child, footer));
  }
  visit(source);
  assert.equal(triggers, 1, `${game}: exactly one footer sources dialog`);
}
console.log('Sources: unique safe links and a single footer entry point for all four games passed.');
