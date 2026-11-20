import { backgroundValue, type Config, type Item } from './config.js';
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

function buttonHtml(item: Item, current: boolean, indent: string): string {
  const attributes = ['type="button"'];
  if (item.action) attributes.push('data-navbar-action');
  else if (current) attributes.push('aria-current="page"');
  const labelShown = item.showLabel && item.label !== '';
  if (!labelShown) attributes.push(`aria-label="${escape(item.label)}"`);
  if (!item.showIcon && item.icon) attributes.push('data-navbar-hide-icon');
  if (!item.showLabel) attributes.push('data-navbar-hide-label');
  const parts: string[] = [];
  if (item.icon) {
    parts.push(`${indent}  <svg data-navbar-icon viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${icons[item.icon]}" /></svg>`);
  }
  parts.push(`${indent}  <span data-navbar-label>${escape(item.label)}</span>`);
  return `${indent}<button ${attributes.join(' ')}>\n${parts.join('\n')}\n${indent}</button>`;
}

export function firstTab(config: Config): Item | undefined {
  return config.items.find((item) => !item.action && (item.showIcon || item.showLabel));
}

export function htmlFor(config: Config): string {
  const current = firstTab(config)?.id;
  const groups = sectionsOf(config);
  const body = config.sectioned
    ? groups.map((group) => `  <div data-navbar-section>\n${group.map((item) => buttonHtml(item, item.id === current, '    ')).join('\n')}\n  </div>`).join('\n')
    : groups.flat().map((item) => buttonHtml(item, item.id === current, '  ')).join('\n');
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
  const background = backgroundValue(config);
  if (background) options.push(`  background: '${background}',`);
  if (config.transparency !== null) options.push(`  transparency: ${config.transparency},`);
  if (config.reorderable) options.push('  reorderable: true,');
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
    'mountLiquidGlassNavbar(nav, {',
    ...options,
    '});',
  ].join('\n');
}
