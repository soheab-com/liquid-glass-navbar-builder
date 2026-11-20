import { mountLiquidGlassNavbar, type LiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import '@soheab-com/liquid-glass-navbar/navbar.css';
import './styles.css';
import {
  backdrops, backgroundKinds, backgroundValue, decodeConfig, defaultConfig, encodeConfig, newId, positions, themes,
  type Config, type Item,
} from './config.js';
import { cssFor, darkPalette, lightPalette, htmlFor, scriptFor } from './code.js';
import { cleanCss, customCssLimit } from './custom-css.js';
import { iconNames, icons, isIconName } from './icons.js';

const storageKey = 'lg-navbar-builder:config';

const element = <T extends Element>(selector: string, type: abstract new () => T): T => {
  const found = document.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`Missing ${selector}.`);
  return found;
};

const frame = element('#frame', HTMLElement);
const stage = element('#stage', HTMLElement);
const itemList = element('#items', HTMLOListElement);
const codeOutput = element('#code', HTMLElement);
const status = element('#status', HTMLElement);

function loadConfig(): Config {
  const fromHash = location.hash.length > 1 ? decodeConfig(location.hash.slice(1)) : null;
  if (fromHash) return fromHash;
  const stored = localStorage.getItem(storageKey);
  return (stored ? decodeConfig(stored) : null) ?? defaultConfig();
}

let config = loadConfig();
let navbar: LiquidGlassNavbar | undefined;
const customSheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, customSheet];
let codeTab: 'html' | 'ts' | 'css' = 'html';

function save(): void {
  const encoded = encodeConfig(config);
  localStorage.setItem(storageKey, encoded);
  history.replaceState(null, '', `#${encoded}`);
}

function announce(message: string): void {
  status.textContent = message;
}

function renderPreview(): void {
  navbar?.destroy();
  stage.replaceChildren();
  frame.dataset.theme = config.theme;
  frame.dataset.backdrop = config.backdrop;
  const holder = document.createElement('template');
  holder.innerHTML = htmlFor(config);
  const nav = holder.content.firstElementChild;
  if (!(nav instanceof HTMLElement)) return;
  nav.style.setProperty('--lg-nav-accent', config.accent);
  for (const [name, value] of Object.entries(config.theme === 'dark' ? darkPalette : lightPalette)) nav.style.setProperty(name, value);
  const ids = config.items.map((item) => item.id);
  const buttons = [...nav.querySelectorAll<HTMLButtonElement>('button')];
  buttons.forEach((button, index) => {
    const id = config.sectioned ? sectionOrder()[index] : ids[index];
    if (id) button.dataset.itemId = id;
  });
  stage.append(nav);
  const custom = cleanCss(config.customCss, '#stage > nav');
  customSheet.replaceSync(custom.css);
  element('#custom-css-note', HTMLElement).textContent = custom.removed > 0
    ? `${custom.removed} rule${custom.removed === 1 ? ' was' : 's were'} left out: only plain style rules work, without url(), @import or escapes.`
    : '';
  const background = backgroundValue(config);
  navbar = mountLiquidGlassNavbar(nav, {
    position: config.position,
    labels: config.labels,
    reorderable: config.reorderable,
    ...(background === undefined ? {} : { background }),
    ...(config.transparency === null ? {} : { transparency: config.transparency }),
    onSelect(button) {
      nav.querySelector('[aria-current="page"]')?.removeAttribute('aria-current');
      button.setAttribute('aria-current', 'page');
      navbar?.sync();
    },
    onAction(button) {
      announce(`${button.getAttribute('aria-label') ?? button.textContent?.trim() ?? 'Action'} pressed.`);
    },
    onReorder(order) {
      const moved = order.map((button) => button.dataset.itemId);
      const byId = new Map(config.items.map((item) => [item.id, item]));
      const reordered = moved.map((id) => (id ? byId.get(id) : undefined)).filter((item): item is Item => item !== undefined);
      const slots = config.items.map((item, index) => (reordered.includes(item) ? index : -1)).filter((index) => index >= 0);
      const items = [...config.items];
      slots.forEach((slot, index) => {
        const item = reordered[index];
        if (item) items[slot] = item;
      });
      config = { ...config, items };
      save();
      renderItems();
      renderCode();
    },
  });
  navbar.setReorderMode(config.reorderable && element('#reorder-mode', HTMLInputElement).checked);
}

function sectionOrder(): string[] {
  return [0, 1].flatMap((section) => config.items.filter((item) => item.section === section).map((item) => item.id));
}

function renderCode(): void {
  const text = codeTab === 'html' ? htmlFor(config) : codeTab === 'ts' ? scriptFor(config) : cssFor(config);
  codeOutput.textContent = text;
  for (const tab of document.querySelectorAll<HTMLButtonElement>('[data-code-tab]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.codeTab === codeTab));
  }
}

function update(change: Partial<Config>, options: { items?: boolean } = {}): void {
  config = { ...config, ...change };
  save();
  if (options.items) renderItems();
  syncControls();
  renderPreview();
  renderCode();
}

function updateItem(id: string, change: Partial<Item>, rerenderList = false): void {
  update({ items: config.items.map((item) => (item.id === id ? { ...item, ...change } : item)) }, { items: rerenderList });
}

function checkbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLLabelElement {
  const wrapper = document.createElement('label');
  wrapper.className = 'nb-check';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  wrapper.append(input, label);
  return wrapper;
}

function iconButton(text: string, label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nb-icon-button';
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function move(id: string, by: number): void {
  const index = config.items.findIndex((item) => item.id === id);
  const target = index + by;
  if (index < 0 || target < 0 || target >= config.items.length) return;
  const items = [...config.items];
  const [item] = items.splice(index, 1);
  if (item) items.splice(target, 0, item);
  update({ items }, { items: true });
}

function renderItems(): void {
  itemList.replaceChildren(...config.items.map((item, index) => {
    const row = document.createElement('li');
    row.className = 'nb-item';

    const name = document.createElement('input');
    name.value = item.label;
    name.maxLength = 40;
    name.setAttribute('aria-label', 'Label');
    name.addEventListener('input', () => updateItem(item.id, { label: name.value }));

    const icon = document.createElement('select');
    icon.setAttribute('aria-label', 'Icon');
    icon.append(new Option('No icon', ''), ...iconNames.map((iconName) => new Option(iconName, iconName)));
    icon.value = item.icon ?? '';
    icon.addEventListener('change', () => updateItem(item.id, { icon: isIconName(icon.value) ? icon.value : null }));

    const preview = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    preview.setAttribute('viewBox', '0 0 24 24');
    preview.setAttribute('aria-hidden', 'true');
    preview.classList.add('nb-item-icon');
    if (item.icon) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', icons[item.icon]);
      preview.append(path);
    }

    const head = document.createElement('div');
    head.className = 'nb-item-head';
    head.append(
      preview, name,
      iconButton('↑', 'Move up', () => move(item.id, -1), index === 0),
      iconButton('↓', 'Move down', () => move(item.id, 1), index === config.items.length - 1),
      iconButton('✕', 'Remove', () => update({ items: config.items.filter((entry) => entry.id !== item.id) }, { items: true }), config.items.length <= 1),
    );

    const flags = document.createElement('div');
    flags.className = 'nb-item-flags';
    flags.append(
      icon,
      checkbox('Icon', item.showIcon, (checked) => updateItem(item.id, { showIcon: checked })),
      checkbox('Label', item.showLabel, (checked) => updateItem(item.id, { showLabel: checked })),
      checkbox('Action', item.action, (checked) => updateItem(item.id, { action: checked })),
    );
    if (config.sectioned) {
      flags.append(checkbox('Own section', item.section === 1, (checked) => updateItem(item.id, { section: checked ? 1 : 0 })));
    }
    row.append(head, flags);
    return row;
  }));
}

function bindSelect<K extends 'position' | 'theme' | 'background' | 'backdrop'>(
  id: string, key: K, values: readonly Config[K][],
): void {
  const select = element(`#${id}`, HTMLSelectElement);
  select.replaceChildren(...values.map((value) => new Option(String(value).replace(/^./, (c) => c.toUpperCase()), String(value))));
  select.addEventListener('change', () => {
    const value = values.find((entry) => entry === select.value);
    if (value === undefined) return;
    const change = { [key]: value } as Partial<Config>;
    if (key === 'theme') {
      const accents: Record<string, string> = { light: '#2152a5', dark: '#a5cbff' };
      if (Object.values(accents).includes(config.accent)) change.accent = accents[String(value)] ?? config.accent;
    }
    update(change);
  });
}

function bindCheck(id: string, key: 'labels' | 'sectioned' | 'reorderable'): void {
  const input = element(`#${id}`, HTMLInputElement);
  input.addEventListener('change', () => update({ [key]: input.checked } as Pick<Config, typeof key>, { items: key === 'sectioned' }));
}

function bindColor(id: string, key: 'accent' | 'color' | 'color2'): void {
  const input = element(`#${id}`, HTMLInputElement);
  input.addEventListener('input', () => update({ [key]: input.value } as Pick<Config, typeof key>));
}

function syncControls(): void {
  element('#position', HTMLSelectElement).value = config.position;
  element('#theme', HTMLSelectElement).value = config.theme;
  element('#background', HTMLSelectElement).value = config.background;
  element('#backdrop', HTMLSelectElement).value = config.backdrop;
  element('#labels', HTMLInputElement).checked = config.labels;
  element('#sectioned', HTMLInputElement).checked = config.sectioned;
  element('#reorderable', HTMLInputElement).checked = config.reorderable;
  element('#accent', HTMLInputElement).value = config.accent;
  element('#color', HTMLInputElement).value = config.color;
  element('#color2', HTMLInputElement).value = config.color2;
  element('#angle', HTMLInputElement).value = String(config.angle);
  element('#angle-value', HTMLOutputElement).value = `${config.angle}°`;
  const auto = config.transparency === null;
  element('#transparency-auto', HTMLInputElement).checked = auto;
  const slider = element('#transparency', HTMLInputElement);
  slider.disabled = auto;
  slider.value = String(config.transparency ?? 40);
  element('#transparency-value', HTMLOutputElement).value = auto ? 'Theme' : `${config.transparency}%`;
  element('#reorder-mode', HTMLInputElement).disabled = !config.reorderable;
  for (const row of document.querySelectorAll<HTMLElement>('[data-show-for]')) {
    row.hidden = !(row.dataset.showFor ?? '').split(' ').includes(config.background);
  }
}

bindSelect('position', 'position', positions);
bindSelect('theme', 'theme', themes);
bindSelect('background', 'background', backgroundKinds);
bindSelect('backdrop', 'backdrop', backdrops);
bindCheck('labels', 'labels');
bindCheck('sectioned', 'sectioned');
bindCheck('reorderable', 'reorderable');
bindColor('accent', 'accent');
bindColor('color', 'color');
bindColor('color2', 'color2');

const angle = element('#angle', HTMLInputElement);
angle.addEventListener('input', () => update({ angle: angle.valueAsNumber }));
const transparency = element('#transparency', HTMLInputElement);
transparency.addEventListener('input', () => update({ transparency: transparency.valueAsNumber }));
const transparencyAuto = element('#transparency-auto', HTMLInputElement);
transparencyAuto.addEventListener('change', () => update({ transparency: transparencyAuto.checked ? null : transparency.valueAsNumber }));
element('#reorder-mode', HTMLInputElement).addEventListener('change', renderPreview);

element('#add-item', HTMLButtonElement).addEventListener('click', () => {
  if (config.items.length >= 12) return announce('A navbar holds up to 12 items.');
  update({ items: [...config.items, { id: newId(), label: 'New', icon: 'star', showIcon: true, showLabel: true, action: false, section: 0 }] }, { items: true });
});

element('#reset', HTMLButtonElement).addEventListener('click', () => {
  config = defaultConfig();
  customCss.value = '';
  update({}, { items: true });
  announce('Reset to the default navbar.');
});

element('#share', HTMLButtonElement).addEventListener('click', async () => {
  await navigator.clipboard.writeText(location.href);
  announce('Link copied.');
});

element('#copy', HTMLButtonElement).addEventListener('click', async () => {
  await navigator.clipboard.writeText(codeOutput.textContent ?? '');
  announce('Code copied.');
});

for (const tab of document.querySelectorAll<HTMLButtonElement>('[data-code-tab]')) {
  tab.addEventListener('click', () => {
    const next = tab.dataset.codeTab;
    if (next === 'html' || next === 'ts' || next === 'css') {
      codeTab = next;
      renderCode();
    }
  });
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-device]')) {
  button.addEventListener('click', () => {
    frame.dataset.device = button.dataset.device ?? 'phone';
    for (const other of document.querySelectorAll<HTMLButtonElement>('[data-device]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    navbar?.sync();
  });
}

const customCss = element('#custom-css', HTMLTextAreaElement);
customCss.maxLength = customCssLimit;
customCss.value = config.customCss;
let cssTimer: number | undefined;
customCss.addEventListener('input', () => {
  clearTimeout(cssTimer);
  cssTimer = window.setTimeout(() => update({ customCss: customCss.value }), 250);
});

syncControls();
renderItems();
renderPreview();
renderCode();
