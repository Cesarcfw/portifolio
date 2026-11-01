const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadApi(fetch) {
  const source = readFileSync(new URL('../src/services/api.ts', `file://${__filename.replaceAll('\\', '/')}`), 'utf8')
    .replace('import.meta.env.VITE_API_URL', 'undefined');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports, fetch, Response });
  return exports;
}

const operations = [
  ['login', ['user@example.com', 'not-a-real-password']],
  ['forgotPassword', ['user@example.com']], ['resetPassword', ['test-token', 'not-a-real-password']],
  ['getProjects', []], ['getFeaturedProjects', []], ['getGithubRepos', []],
  ['getGithubContributions', []], ['getGithubLanguages', []], ['getGithubVersion', []],
  ['getSettings', []], ['updateSettings', ['test-token', {}]],
  ['getSkills', []], ['createSkill', ['test-token', {}]], ['updateSkill', ['test-token', 1, {}]], ['removeSkill', ['test-token', 1]],
  ['getExperiences', []], ['createExperience', ['test-token', {}]], ['updateExperience', ['test-token', 1, {}]], ['removeExperience', ['test-token', 1]],
  ['uploadResumePair', ['test-token', {}, {}]], ['uploadResumeCounterpart', ['test-token', 1, {}]],
  ['replaceResumeFile', ['test-token', 1, 'test']], ['linkResumeCounterparts', ['test-token', 1, 2]],
  ['reorderResumePairs', ['test-token', [1]]], ['removeResumePair', ['test-token', 1]],
  ['editResume', ['test-token', 1, 'Test', '', 'pt-BR']], ['removeResume', ['test-token', 1]],
];

for (const status of [400, 401, 403, 429, 500]) test(`all API operations reject HTTP ${status}`, async () => {
  const api = loadApi(async () => new Response(JSON.stringify({ code: `HTTP_${status}`, error: 'Simulated failure' }), { status }));
  for (const [name, args] of operations) await assert.rejects(api[name](...args), error => error.code === `HTTP_${status}`, name);
});

test('network failures reject instead of reporting success', async () => {
  const api = loadApi(async () => { throw new TypeError('Offline'); });
  for (const [name, args] of operations) await assert.rejects(api[name](...args), /Offline/, name);
});

test('invalid JSON and legacy error bodies reject; valid responses and 204 succeed', async () => {
  const api = loadApi(async () => new Response('{}'));
  await assert.rejects(api.readResponse(new Response('not-json')), error => error.code === 'API_INVALID_RESPONSE');
  await assert.rejects(api.readResponse(new Response('{"error":"Legacy error"}')), /Legacy error/);
  assert.equal(JSON.stringify(await api.readResponse(new Response(null, { status: 204 }))), '{}');
  assert.equal((await api.readResponse(new Response('{"success":true}'))).success, true);
});

test('fixed status choices have manual English labels; unknown copy is not auto-translated', () => {
  const source = readFileSync(new URL('../src/utils/statusTranslations.ts', `file://${__filename.replaceAll('\\', '/')}`), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  vm.runInNewContext(outputText, { exports });
  assert.equal(exports.statusEnglish('Disponível para oportunidades Agora'), 'Available for opportunities');
  assert.equal(exports.statusEnglish('Status atual: Estagiando'), 'Internship');
  assert.equal(exports.statusEnglish('Conteúdo livre ainda sem tradução'), undefined);
});
