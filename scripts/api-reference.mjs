import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export async function renderApiReference(packageRoot) {
  const entry = path.resolve(packageRoot, 'src/index.ts');
  const program = ts.createProgram([entry], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  const module = source && checker.getSymbolAtLocation(source);
  if (!module) throw new Error('The installed navbar does not expose a TypeScript module.');

  const exports = checker.getExportsOfModule(module).sort((a, b) => a.name.localeCompare(b.name));
  const declarations = exports.map((entry) => {
    const symbol = entry.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(entry) : entry;
    const definition = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!definition) throw new Error(`Cannot read public declaration ${entry.name}.`);
    const text = ts.isFunctionDeclaration(definition)
      ? `function ${entry.name}${checker.signatureToString(checker.getSignatureFromDeclaration(definition), definition, ts.TypeFormatFlags.NoTruncation)}`
      : definition.getText().replace(/^export /, '');
    const description = ts.displayPartsToString(symbol.getDocumentationComment(checker));
    return `<details id="api-${escape(entry.name)}"><summary><code>${escape(entry.name)}</code></summary>
      ${description ? `<p>${escape(description)}</p>` : ''}
      <pre><code>${escape(text)}</code></pre></details>`;
  });

  const css = await readFile(path.join(packageRoot, 'src/navbar.css'), 'utf8');
  const files = await readdir(path.join(packageRoot, 'src'));
  const js = await Promise.all(files.filter((file) => file.endsWith('.ts'))
    .map((file) => readFile(path.join(packageRoot, 'src', file), 'utf8')));
  const variables = [...new Set(css.match(/--(lg-nav|lg-popover)-[\w-]+/g))].sort();
  const runtimeAttributes = new Set(['data-navbar-context', 'data-navbar-context-hidden', 'data-navbar-generated',
    'data-navbar-lens', 'data-navbar-overflow-current']);
  const attributes = [...new Set([css, ...js].join('\n').match(/\bdata-navbar-[\w-]+/g))]
    .filter((attribute) => !runtimeAttributes.has(attribute)).sort();
  const list = (values) => `<ul class="dd-api-tokens">${values.map((value) => `<li><code>${escape(value)}</code></li>`).join('')}</ul>`;

  return `<section id="complete-api">
    <h2>Complete package reference</h2>
    <p>Generated from the installed package. Open an export to see its current signature and options.</p>
    <div class="dd-api-exports">${declarations.join('\n')}</div>
    <h3>Markup attributes</h3>${list(attributes)}
    <h3>CSS custom properties</h3>${list(variables)}
  </section>`;
}
