import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const upstream = 'soheab-com/liquid-glass-navbar';
const release = JSON.parse(execFileSync('gh', ['api', `repos/${upstream}/releases/latest`], { encoding: 'utf8' }));
const version = /^v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1];
if (!version || !Number.isFinite(Date.parse(release.published_at))) throw new Error('Expected a stable navbar release with a publication date.');

const metadataFile = 'src/docs/release.json';
const current = JSON.parse(await readFile(metadataFile, 'utf8'));
if (current.version === version) {
  console.log(`Navbar v${version} is already installed.`);
  process.exit(0);
}
const currentParts = current.version.split('.').map(Number);
const nextParts = version.split('.').map(Number);
const firstDifference = nextParts.findIndex((part, index) => part !== currentParts[index]);
if (firstDifference < 0 || nextParts[firstDifference] < currentParts[firstDifference]) {
  throw new Error(`Refusing to change v${current.version} to the older v${version}.`);
}

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const inline = (value) => escape(value).replace(/`([^`]+)`/g, '<code>$1</code>');
const notes = String(release.body ?? '').trim().split(/\r?\n\s*\r?\n/).filter(Boolean).map((block) => {
  if (block.startsWith('### ')) return `<h3>${inline(block.slice(4))}</h3>`;
  if (block.split('\n').every((line) => line.startsWith('- '))) {
    return `<ul>${block.split('\n').map((line) => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
  }
  return `<p>${inline(block)}</p>`;
}).join('\n            ');
const date = release.published_at.slice(0, 10);
const formatted = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(release.published_at));
const entry = `        <details id="release-v${version}" open>
          <summary><strong>v${version}</strong> <time datetime="${date}">${formatted}</time></summary>
          <div class="dd-release-notes">
            ${notes}
            <p><a href="https://github.com/${upstream}/releases/tag/v${version}">Release on GitHub</a></p>
          </div>
        </details>`;

const changelogFile = 'src/docs/changelog.html';
let changelog = await readFile(changelogFile, 'utf8');
if (!changelog.includes(`id="release-v${version}"`)) {
  const start = '<div class="dd-changelog">';
  if (!changelog.includes(start)) throw new Error('Cannot find the changelog sections.');
  let count = 0;
  changelog = changelog.replace(/(<details id="release-v[\d.]+" )open>/g, (_, tag) => count++ === 0 ? `${tag}open>` : `${tag.trimEnd()}>`);
  changelog = changelog.replace(start, () => `${start}\n${entry}`);
}

execFileSync('npm', ['install', `@soheab-com/liquid-glass-navbar@github:${upstream}#v${version}`, '--ignore-scripts'], { stdio: 'inherit' });
await writeFile(metadataFile, JSON.stringify({ version, publishedAt: release.published_at }, null, 2) + '\n');
await writeFile(changelogFile, changelog);
