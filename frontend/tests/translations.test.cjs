const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(name) {
  const source = readFileSync(join(__dirname, '../src/utils', name + '.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const exports = {};
  vm.runInNewContext(outputText, { exports });
  return exports;
}

test('published content has reviewed English translations without changing proper names', () => {
  const { englishContent } = load('contentTranslations');
  for (const original of ['Site e-simon', 'Dashboard e-simon', 'Estagiário de TI', 'Jovem Aprendiz', 'Ciência da Computação', 'Conclusão prevista: 12/2026', 'Infraestrutura', 'Ferramentas', 'Banco de dados', 'Curriculo Brasil']) {
    const translated = englishContent(original);
    assert(translated && translated !== original, original);
  }
  for (const brand of ['React', 'Node.js', 'WordPress', 'MTEC Energia']) assert.equal(englishContent(brand), brand);
  assert.equal(englishContent('Estagiário de TI', 'Estagiário de TI'), 'IT Intern');
  assert.equal(englishContent('2025 - Atualmente', '2025 - at the moment'), '2025–Present');
  assert.equal(englishContent('Custom text', 'Author-approved English copy'), 'Author-approved English copy');
  assert.equal(englishContent('A new text not in the reviewed catalog'), undefined);
  assert.equal(englishContent('Site e-simon edited later'), undefined);
});

test('visible Portuguese admin copy passed to t() is covered by the manual UI catalog', () => {
  const { englishUi } = load('uiTranslations');
  const source = readFileSync(join(__dirname, '../src/pages/Admin.tsx'), 'utf8');
  const file = ts.createSourceFile('Admin.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(file) === 't' && ts.isStringLiteral(node.arguments[0])) {
      const text = node.arguments[0].text;
      const probe = text.replace(/résumés?/gi, 'resume');
      if (/[áéíóúâêôãõç]/i.test(probe) || /^(Salvar|Cancelar|Excluir|Editar|Projetos|Senha|Entrar|Adicionar|Deletar|Posição|Versão|Nenhuma)/.test(probe)) assert.notEqual(englishUi(text), text, text);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  assert.equal(englishUi('Substituindo o PDF de Software developer...'), 'Replacing the PDF for Software developer…');
  assert.equal(englishUi('E-mail ou senha incorretos'), 'Incorrect email address or password.');
});

test('translation does not alter language identifiers, routes or request property names', () => {
  const { englishUi } = load('uiTranslations');
  for (const value of ['pt-BR', 'en', '/api/settings', 'name_en', 'em_andamento']) assert.equal(englishUi(value), value);
});
