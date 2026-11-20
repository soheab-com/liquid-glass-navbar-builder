import * as esbuild from 'esbuild';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const out = 'dist.next';
const assets = path.join(out, 'assets');
await rm(out, { recursive: true, force: true });
await mkdir(assets, { recursive: true });

const result = await esbuild.build({
  entryPoints: ['src/app.ts'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outdir: assets,
  entryNames: '[name]-[hash]',
  metafile: true,
  logLevel: 'warning',
});
const [js, info] = Object.entries(result.metafile.outputs).find(([, output]) => output.entryPoint === 'src/app.ts');
const html = (await readFile('src/index.html', 'utf8'))
  .replace('{{APP_JS}}', path.relative(out, js))
  .replace('{{APP_CSS}}', path.relative(out, info.cssBundle));
await writeFile(path.join(out, 'index.html'), html);

// Swap the finished build in so the live site never serves a partial one.
await rm('dist.old', { recursive: true, force: true });
await rename('dist', 'dist.old').catch(() => {});
await rename(out, 'dist');
await rm('dist.old', { recursive: true, force: true });
