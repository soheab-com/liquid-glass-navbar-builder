import { mountLiquidGlassNavbar, type LiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import '@soheab-com/liquid-glass-navbar/navbar.css';
import highlight from 'highlight.js/lib/core';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import './styles.css';
import {
  backdrops, backgroundKinds, backgroundValue, decodeConfig, defaultConfig, encodeConfig, newId, positions, themes,
  colorsValue, equalOverflows, type Config, type Item, badgeValue, overflowValue, layouts, overflowChoices,
  expandSurfaces, maxItems,
} from './config.js';
import { cssFor, darkPalette, lightPalette, htmlFor, scriptFor } from './code.js';
import { cleanCss, customCssLimit } from './custom-css.js';
import { iconNames, icons, isIconName } from './icons.js';

highlight.registerLanguage('html', xml);
highlight.registerLanguage('ts', typescript);
highlight.registerLanguage('css', css);

const storageKey = 'lg-navbar-builder:config';

const element = <T extends Element>(selector: string, type: abstract new () => T): T => {
  const found = document.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`Missing ${selector}.`);
  return found;
};

const frame = element('#frame', HTMLElement);
const sample = element('#frame > .nb-content', HTMLElement);
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
  const colors = colorsValue(config);
  navbar = mountLiquidGlassNavbar(nav, {
    position: config.position,
    labels: config.labels,
    equalWidth: config.equalWidth,
    equalWidthOverflow: config.equalOverflow,
    reorderable: config.reorderable,
    ...(background === undefined ? {} : { background }),
    ...(config.transparency === null ? {} : { transparency: config.transparency }),
    colors,
    layout: config.layout,
    ...(config.overflow !== 'none' && config.maxRows !== null && config.layout !== 'row' ? { maxRows: config.maxRows } : {}),
    ...(overflowValue(config) ? { overflow: { ...overflowValue(config), boundary: frame } } : {}),
    ...(config.scrollCompact ? { scrollCompact: { source: sample } } : {}),
    ...(config.magnify ? { magnify: true } : {}),
    ...(config.animations ? { animations: true } : {}),
    ...(config.contrast ? { contrast: { adaptiveTint: config.adaptiveTint } } : {}),
    onAction(button) {
      if (button.dataset.context === 'done') {
        navbar?.hideContextActions();
        announce('Navigation restored.');
        return;
      }
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
  const palette = config.theme === 'dark' ? darkPalette : lightPalette;
  for (const [name, value] of Object.entries(palette)) {
    if (!nav.style.getPropertyValue(name)) nav.style.setProperty(name, value);
  }
  navbar.setReorderMode(config.reorderable && element('#reorder-mode', HTMLInputElement).checked);
  for (const button of buttons) {
    const item = config.items.find((entry) => entry.id === button.dataset.itemId);
    const badge = item ? badgeValue(item.badge) : null;
    if (badge) navbar.setBadge(button, { ...badge, label: 'dot' in badge ? 'New' : `${badge.count} new` });
  }
  element('#try-context', HTMLButtonElement).textContent = 'Show context actions';
}

function contextNodes(): HTMLElement[] {
  const make = (label: string, icon: keyof typeof icons, context?: string): HTMLButtonElement => {
    const holder = document.createElement('template');
    holder.innerHTML = `<button type="button" data-navbar-action><svg data-navbar-icon viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[icon]}" /></svg><span data-navbar-label></span></button>`;
    const button = holder.content.firstElementChild as HTMLButtonElement;
    button.querySelector('span')!.textContent = label;
    if (context) button.dataset.context = context;
    return button;
  };
  const actions = document.createElement('div');
  actions.setAttribute('data-navbar-section', '');
  actions.append(make('Share', 'star'), make('Move', 'map'));
  const done = document.createElement('div');
  done.setAttribute('data-navbar-section', '');
  done.append(make('Done', 'home', 'done'));
  return [actions, done];
}

function sectionOrder(): string[] {
  return [0, 1].flatMap((section) => config.items.filter((item) => item.section === section).map((item) => item.id));
}

function renderCode(): void {
  const text = codeTab === 'html' ? htmlFor(config) : codeTab === 'ts' ? scriptFor(config) : cssFor(config);
  codeOutput.innerHTML = highlight.highlight(text, { language: codeTab }).value;
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

function updateTransparency(value: Config['transparency']): void {
  config = { ...config, transparency: value };
  save();
  syncControls();
  navbar?.setTransparency(value ?? undefined);
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

function choice(label: string, values: readonly (readonly [string, string])[], current: string, onChange: (value: string) => void): HTMLSelectElement {
  const select = document.createElement('select');
  select.setAttribute('aria-label', label);
  select.append(...values.map(([value, text]) => new Option(text, value)));
  if (!values.some(([value]) => value === current)) select.append(new Option(current, current));
  select.value = current;
  select.addEventListener('change', () => onChange(select.value));
  return select;
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
      checkbox('Hide icon', !item.showIcon, (checked) => updateItem(item.id, { showIcon: !checked })),
      checkbox('Hide label', !item.showLabel, (checked) => updateItem(item.id, { showLabel: !checked })),
      checkbox('Action', item.action, (checked) => updateItem(item.id, { action: checked })),
      choice('Badge', [['', 'No badge'], ['dot', 'Dot'], ['3', 'Count 3'], ['12', 'Count 12'], ['120', 'Count 120']], item.badge,
        (value) => updateItem(item.id, { badge: value })),
    );
    if (config.layout !== 'row') {
      flags.append(choice('Row', [['0', 'Auto row'], ['1', 'Row 1'], ['2', 'Row 2'], ['3', 'Row 3']], String(item.row),
        (value) => updateItem(item.id, { row: Number(value) })));
    }
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

function bindColor(id: string, key: 'accent' | 'color' | 'color2' | 'unselected' | 'selectedIcon' | 'unselectedIcon'): void {
  const input = element(`#${id}`, HTMLInputElement);
  const apply = (): void => {
    if (input.value !== config[key]) update({ [key]: input.value } as Pick<Config, typeof key>);
  };
  input.addEventListener('input', apply);
  input.addEventListener('change', apply);
}

function syncControls(): void {
  element('#position', HTMLSelectElement).value = config.position;
  element('#theme', HTMLSelectElement).value = config.theme;
  element('#background', HTMLSelectElement).value = config.background;
  element('#backdrop', HTMLSelectElement).value = config.backdrop;
  element('#labels', HTMLInputElement).checked = config.labels;
  element('#equal-width', HTMLInputElement).checked = config.equalWidth;
  element('#equal-overflow', HTMLSelectElement).value = config.equalOverflow;
  element('#equal-overflow-row', HTMLElement).hidden = !config.equalWidth;
  const unselectedAuto = config.unselected === null;
  element('#unselected-auto', HTMLInputElement).checked = unselectedAuto;
  element('#unselected-color-row', HTMLElement).hidden = unselectedAuto;
  const palette = config.theme === 'dark' ? darkPalette : lightPalette;
  element('#unselected', HTMLInputElement).value = config.unselected ?? palette['--lg-nav-muted'];
  element('#icon-colors', HTMLInputElement).checked = config.iconColors;
  element('#selected-icon', HTMLInputElement).value = config.selectedIcon;
  element('#unselected-icon', HTMLInputElement).value = config.unselectedIcon;
  for (const row of document.querySelectorAll<HTMLElement>('[data-icon-colors]')) row.hidden = !config.iconColors;
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
  slider.value = String(config.transparency ?? 40);
  element('#transparency-value', HTMLOutputElement).value = auto ? 'Theme' : `${config.transparency}%`;
  element('#reorder-mode-row', HTMLElement).hidden = !config.reorderable;
  const vertical = config.position === 'left' || config.position === 'right';
  element('#layout', HTMLSelectElement).value = config.layout;
  element('#layout', HTMLSelectElement).disabled = vertical;
  element('#overflow', HTMLSelectElement).value = config.overflow;
  element('#overflow', HTMLSelectElement).disabled = vertical;
  element('#expand-surface', HTMLSelectElement).value = config.expandSurface;
  element('#overflow-trigger', HTMLSelectElement).value = config.overflowTrigger;
  element('#overflow-trigger-row', HTMLElement).hidden = config.overflow === 'none';
  element('#expand-surface-row', HTMLElement).hidden = config.overflow !== 'expand';
  element('#max-rows', HTMLSelectElement).value = config.maxRows === null ? '' : String(config.maxRows);
  element('#max-rows-row', HTMLElement).hidden = config.overflow === 'none' || config.layout === 'row';
  element('#max-visible', HTMLSelectElement).value = config.maxVisible === null ? '' : String(config.maxVisible);
  element('#max-visible-row', HTMLElement).hidden = config.overflow === 'none';
  element('#scroll-compact', HTMLInputElement).checked = config.scrollCompact;
  element('#contrast', HTMLInputElement).checked = config.contrast;
  element('#adaptive-tint', HTMLInputElement).checked = config.adaptiveTint;
  element('#adaptive-tint-row', HTMLElement).hidden = !config.contrast;
  element('#context-actions', HTMLInputElement).checked = config.contextActions;
  element('#magnify', HTMLInputElement).checked = config.magnify;
  element('#animations', HTMLInputElement).checked = config.animations;
  element('#try-context', HTMLButtonElement).hidden = !config.contextActions;
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

const equalWidth = element('#equal-width', HTMLInputElement);
equalWidth.addEventListener('change', () => update({ equalWidth: equalWidth.checked }));
const equalOverflow = element('#equal-overflow', HTMLSelectElement);
equalOverflow.addEventListener('change', () => {
  const value = equalOverflows.find((entry) => entry === equalOverflow.value);
  if (value) update({ equalOverflow: value });
});
const unselected = element('#unselected', HTMLInputElement);
bindColor('unselected', 'unselected');
const unselectedAuto = element('#unselected-auto', HTMLInputElement);
unselectedAuto.addEventListener('change', () => update({ unselected: unselectedAuto.checked ? null : unselected.value }));
const iconColors = element('#icon-colors', HTMLInputElement);
iconColors.addEventListener('change', () => update({ iconColors: iconColors.checked }));
bindColor('selected-icon', 'selectedIcon');
bindColor('unselected-icon', 'unselectedIcon');

function bindChoice<K extends 'layout' | 'overflow' | 'expandSurface'>(id: string, key: K, values: readonly Config[K][]): void {
  const select = element(`#${id}`, HTMLSelectElement);
  select.addEventListener('change', () => {
    const value = values.find((entry) => entry === select.value);
    if (value !== undefined) update({ [key]: value } as Partial<Config>, { items: key === 'layout' });
  });
}
bindChoice('layout', 'layout', layouts);
bindChoice('overflow', 'overflow', overflowChoices);
bindChoice('expand-surface', 'expandSurface', expandSurfaces);
const overflowTrigger = element('#overflow-trigger', HTMLSelectElement);
overflowTrigger.addEventListener('change', () => update({ overflowTrigger: overflowTrigger.value === 'dots' ? 'dots' : 'more' }));
for (const [id, key] of [['max-rows', 'maxRows'], ['max-visible', 'maxVisible']] as const) {
  const select = element(`#${id}`, HTMLSelectElement);
  select.addEventListener('change', () => update({ [key]: select.value ? Number(select.value) : null }));
}
for (const [id, key] of [['scroll-compact', 'scrollCompact'], ['contrast', 'contrast'], ['adaptive-tint', 'adaptiveTint'], ['context-actions', 'contextActions'], ['magnify', 'magnify'], ['animations', 'animations']] as const) {
  const input = element(`#${id}`, HTMLInputElement);
  input.addEventListener('change', () => update({ [key]: input.checked }));
}
element('#try-context', HTMLButtonElement).addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  if (navbar?.contextActive) {
    navbar.hideContextActions();
    button.textContent = 'Show context actions';
  } else {
    navbar?.showContextActions(contextNodes(), { label: 'Selection actions' });
    button.textContent = 'Restore navigation';
  }
});

const angle = element('#angle', HTMLInputElement);
angle.addEventListener('input', () => update({ angle: angle.valueAsNumber }));
const transparency = element('#transparency', HTMLInputElement);
transparency.addEventListener('input', () => updateTransparency(transparency.valueAsNumber));
const transparencyAuto = element('#transparency-auto', HTMLInputElement);
transparencyAuto.addEventListener('change', () => updateTransparency(transparencyAuto.checked ? null : transparency.valueAsNumber));
element('#reorder-mode', HTMLInputElement).addEventListener('change', renderPreview);

element('#add-item', HTMLButtonElement).addEventListener('click', () => {
  if (config.items.length >= maxItems) return announce(`A navbar holds up to ${maxItems} items.`);
  update({ items: [...config.items, { id: newId(), label: 'New', icon: 'star', showIcon: true, showLabel: true, action: false, section: 0, row: 0, badge: '' }] }, { items: true });
});

const presetSelect = element('#preset', HTMLSelectElement);
const presetButton = element('#apply-preset', HTMLButtonElement);
presetSelect.addEventListener('change', () => {
  presetButton.disabled = !presetSelect.value;
});
presetButton.addEventListener('click', async () => {
  if (!presetSelect.value) return;

  const previousConfig = config;
  const presetId = presetSelect.value;
  const label = presetSelect.selectedOptions[0]?.textContent ?? 'Preset';
  presetButton.disabled = true;
  presetSelect.disabled = true;
  presetButton.textContent = 'Loading…';
  try {
    const { loadPreset } = await import('./presets.js');
    const preset = loadPreset(presetId);
    if (!preset || config !== previousConfig) return;
    clearTimeout(cssTimer);
    customCss.value = preset.customCss;
    element('#reorder-mode', HTMLInputElement).checked = false;
    sample.scrollTop = 0;
    update(preset, { items: true });
    announce(`${label} applied.`);
  } catch {
    announce('Could not load the preset. Reload and try again.');
  } finally {
    presetSelect.disabled = false;
    presetButton.disabled = !presetSelect.value;
    presetButton.textContent = 'Apply';
  }
});

element('#reset', HTMLButtonElement).addEventListener('click', () => {
  clearTimeout(cssTimer);
  config = defaultConfig();
  presetSelect.value = '';
  presetButton.disabled = true;
  codeTab = 'html';
  element('.nb-code', HTMLDetailsElement).open = true;
  element('#reorder-mode', HTMLInputElement).checked = false;
  element<HTMLButtonElement>('.nb-device button[data-device="phone"]', HTMLButtonElement).click();
  sample.scrollTop = 0;
  for (const section of document.querySelectorAll<HTMLDetailsElement>('.nb-panel details')) {
    section.open = section.hasAttribute('data-default-open');
  }
  customCss.value = '';
  update({}, { items: true });
  window.scrollTo(0, 0);
  announce('Restored all defaults.');
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

const deviceButtons = document.querySelectorAll<HTMLButtonElement>('.nb-device button[data-device]');
for (const button of deviceButtons) {
  button.addEventListener('click', () => {
    frame.dataset.device = button.dataset.device ?? 'phone';
    for (const other of deviceButtons) {
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
