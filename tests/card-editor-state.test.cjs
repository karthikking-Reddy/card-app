const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('@babel/core');

function loadUtility() {
  const code = transformSync(fs.readFileSync('src/utils/cardEditorState.js', 'utf8'), {
    babelrc: false,
    configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  }).code;
  const exports = {};
  vm.runInNewContext(code, { exports });
  return exports;
}

test('card editor compares every locally saved field and detects exact reverts', () => {
  const { CARD_EDITOR_FIELDS, areCardEditableValuesEqual, getCardEditableValues } = loadUtility();
  assert.deepEqual(Array.from(CARD_EDITOR_FIELDS), [
    'name',
    'designation',
    'company',
    'phone',
    'email',
    'website',
    'whatsapp',
    'tagline',
    'bio',
    'industry',
    'location',
  ]);

  const original = getCardEditableValues({ name: 'Karthik', company: 'YNS', phone: '+91 1' });
  const changed = { ...original, company: 'ABC' };
  assert.equal(areCardEditableValuesEqual(original, changed), false);
  changed.company = 'YNS';
  assert.equal(areCardEditableValuesEqual(original, changed), true);
});

test('card editor normalizes missing values without marking initial load dirty', () => {
  const { areCardEditableValuesEqual, getCardEditableValues } = loadUtility();
  const loaded = getCardEditableValues({ phone: '+91 1', whatsapp: null });
  assert.equal(loaded.whatsapp, '+91 1');
  assert.equal(areCardEditableValuesEqual(loaded, { ...loaded }), true);
});
