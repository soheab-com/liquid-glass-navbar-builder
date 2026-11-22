import { backgroundValue, badgeValue, colorsValue, overflowValue, type Config, type Item } from './config.js';
import { cleanCss } from './custom-css.js';
import { icons } from './icons.js';

export const lightPalette = {
  '--lg-nav-muted': '#293b60',
} as const satisfies Record<string, string>;

export const darkPalette = {
  '--lg-nav-opaque': '#293b5f',
  '--lg-nav-surface': '#293b5fbd',
  '--lg-nav-muted': '#e9f3ff',
  '--lg-nav-rim': '#a8c0ef66',
  '--lg-nav-highlight': '#e8f0ff50',
  '--lg-nav-shadow': '#040b1a88',
} as const satisfies Record<string, string>;

export const sectionsOf = (config: Config): Item[][] => {
  if (!config.sectioned) return [config.items];
  return [0, 1].map((section) => config.items.filter((item) => item.section === section)).filter((group) => group.length > 0);
};

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function buttonHtml(item: Item, current: boolean, labels: boolean, indent: string): string {
  const attributes = ['type="button"'];
  if (item.action) attributes.push('data-navbar-action');
  else if (current) attributes.push('aria-current="page"');
  const labelShown = item.showLabel && item.label !== '';
  if (!labelShown) attributes.push(`aria-label="${escape(item.label)}"`);
  if (item.row > 0) attributes.push(`data-navbar-row="${item.row}"`);
  if (!item.showIcon || !item.icon) attributes.push('data-navbar-hide-icon');
  if (!labelShown || !labels) attributes.push('data-navbar-hide-label');
  const parts: string[] = [];
  if (item.icon) {
    parts.push(`${indent}  <svg data-navbar-icon viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[item.icon]}" /></svg>`);
  }
  parts.push(`${indent}  <span data-navbar-label>${escape(item.label)}</span>`);
  return `${indent}<button ${attributes.join(' ')}>\n${parts.join('\n')}\n${indent}</button>`;
}

export function firstTab(config: Config): Item | undefined {
  return config.items.find((item) => !item.action && ((item.showIcon && item.icon) || (config.labels && item.showLabel && item.label)));
}

export function htmlFor(config: Config): string {
  const current = firstTab(config)?.id;
  const groups = sectionsOf(config);
  const body = config.sectioned
    ? groups.map((group) => `  <div data-navbar-section>\n${group.map((item) => buttonHtml(item, item.id === current, config.labels, '    ')).join('\n')}\n  </div>`).join('\n')
    : groups.flat().map((item) => buttonHtml(item, item.id === current, config.labels, '  ')).join('\n');
  return `<nav id="app-navbar" aria-label="Navigation">\n${body}\n</nav>`;
}

export function cssFor(config: Config): string {
  const lines = [`  --lg-nav-accent: ${config.accent};`];
  for (const [name, value] of Object.entries(config.theme === 'dark' ? darkPalette : lightPalette)) lines.push(`  ${name}: ${value};`);
  const custom = cleanCss(config.customCss, '#app-navbar').css;
  return `#app-navbar {\n${lines.join('\n')}\n}${custom ? `\n\n${custom}` : ''}`;
}

export function scriptFor(config: Config): string {
  const options = [`  position: '${config.position}',`];
  if (!config.labels) options.push('  labels: false,');
  if (config.equalWidth) {
    options.push('  equalWidth: true,');
    if (config.equalOverflow !== 'natural') options.push(`  equalWidthOverflow: '${config.equalOverflow}',`);
  }
  const colors = colorsValue(config);
  options.push('  colors: {');
  for (const [name, value] of Object.entries(colors)) options.push(`    ${name}: '${value}',`);
  options.push('  },');
  const background = backgroundValue(config);
  if (background) options.push(`  background: '${background}',`);
  if (config.transparency !== null) options.push(`  transparency: ${config.transparency},`);
  if (config.reorderable) options.push('  reorderable: true,');
  if (config.layout !== 'row') options.push(`  layout: '${config.layout}',`);
  const overflow = overflowValue(config);
  if (overflow) {
    const parts = [`style: '${overflow.style}'`];
    if (overflow.surface) parts.push(`surface: '${overflow.surface}'`);
    if (overflow.maxVisible !== undefined) parts.push(`maxVisible: ${overflow.maxVisible}`);
    options.push(`  overflow: { ${parts.join(', ')} },`);
    if (config.maxRows !== null && config.layout !== 'row') options.push(`  maxRows: ${config.maxRows},`);
  }
  if (config.magnify) options.push('  magnify: true, // or { scale: 1.4, lift: 10, range: 110 }');
  if (config.scrollCompact) options.push('  scrollCompact: true, // or { source: yourScrollingElement }');
  if (config.contrast) {
    options.push(config.adaptiveTint ? '  contrast: { adaptiveTint: true },' : '  contrast: true,');
  }
  options.push('  onSelect(button) {', '    // Show the page for this tab.', '  },');
  if (config.items.some((item) => item.action)) {
    options.push('  onAction(button) {', '    // Open the action this button stands for.', '  },');
  }
  if (config.reorderable) {
    options.push('  onReorder(order, section) {', '    // Save the new order.', '  },');
  }
  return [
    "import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';",
    "import '@soheab-com/liquid-glass-navbar/navbar.css';",
    '',
    "const nav = document.querySelector<HTMLElement>('#app-navbar');",
    "if (!nav) throw new Error('Missing #app-navbar.');",
    `${extras(config).length ? 'const navbar = ' : ''}mountLiquidGlassNavbar(nav, {`,
    ...options,
    '});',
    ...extras(config),
  ].join('\n');
}

function extras(config: Config): string[] {
  const lines: string[] = [];
  if (config.items.some((item) => item.badge)) {
    lines.push('', '// Badges. Call setBadge again to update a count, or pass null to remove it.',
      "const items = nav.querySelectorAll<HTMLButtonElement>('button');");
    sectionsOf(config).flat().forEach((item, index) => {
      const badge = badgeValue(item.badge);
      if (!badge) return;
      const value = 'dot' in badge ? `{ dot: true, label: 'New' }` : `{ count: ${badge.count}, label: '${badge.count} new' }`;
      lines.push(`navbar.setBadge(items[${index}]!, ${value}); // ${item.label.replaceAll('\n', ' ')}`);
    });
  }
  if (config.contrast) {
    lines.push('', '// Mark dark or detailed content behind the bar:', '// <section data-navbar-backdrop="dark busy">…</section>');
  }
  if (config.contextActions) {
    lines.push(
      '', '// Swap in contextual actions, for example while files are selected.',
      'function showSelectionActions(actions: HTMLElement[]): void {',
      "  navbar.showContextActions(actions, { label: 'Selection actions' });",
      '}',
      'function leaveSelection(): void {',
      '  navbar.hideContextActions(); // restores the tab that was selected',
      '}',
    );
  }
  return lines;
}
