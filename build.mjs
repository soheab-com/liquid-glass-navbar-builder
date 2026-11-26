import * as esbuild from 'esbuild';
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// `OUT=some/dir node build.mjs` builds a preview there and leaves the live dist/ alone.
const preview = process.env.OUT;
const out = preview ?? 'dist.next';
const assets = path.join(out, 'assets');
await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

// Each page: its script entry, its HTML template, and where the HTML goes.
const pages = [
  { entry: 'src/app.ts', template: 'src/index.html', html: 'index.html' },
  { entry: 'src/docs/docs.ts', template: 'src/docs/index.html', html: 'docs/index.html' },
  { entry: 'src/docs/settings.ts', template: 'src/docs/settings/index.html', html: 'docs/settings/index.html' },
];

// `import source from './x.ts?raw'` gives a file's text: the docs show each example's real source.
const raw = {
  name: 'raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({ path: path.resolve(args.resolveDir, args.path.slice(0, -4)), namespace: 'raw' }));
    build.onLoad({ filter: /.*/, namespace: 'raw' }, async (args) => ({ contents: await readFile(args.path, 'utf8'), loader: 'text' }));
  },
};

const result = await esbuild.build({
  plugins: [raw],
  entryPoints: pages.map((page) => page.entry),
  bundle: true,
  splitting: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outdir: assets,
  loader: { '.jpg': 'file' },
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  metafile: true,
  logLevel: 'warning',
});
const changelog = await readFile('src/docs/changelog.html', 'utf8');
for (const page of pages) {
  const [js, info] = Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint === page.entry);
  const target = path.join(out, page.html);
  const from = path.dirname(target);
  await mkdir(from, { recursive: true });
  const html = (await readFile(page.template, 'utf8'))
    .replace('{{APP_JS}}', path.relative(from, js))
    .replace('{{APP_CSS}}', path.relative(from, info.cssBundle))
    .replace('{{CHANGELOG}}', changelog.trimEnd());
  await writeFile(target, html);
}

await copyFile('src/docs/theme-bootstrap.js', path.join(out, 'docs/theme-bootstrap.js'));
await copyFile('src/docs/llms.txt', path.join(out, 'docs/llms.txt'));

if (!preview) {
  // Swap the finished build in so the live site never serves a partial one.
  await rm('dist.old', { recursive: true, force: true });
  await rename('dist', 'dist.old').catch(() => {});
  await rename(out, 'dist');
  await rm('dist.old', { recursive: true, force: true });
}
