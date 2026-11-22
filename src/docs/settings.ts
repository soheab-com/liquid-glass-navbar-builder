import '@soheab-com/liquid-glass-navbar/navbar.css';
import './docs.css';
import { themeButton } from './theme.js';
import {
  defaultSettings, groups, loadSettings, mountSiteBar, onSettingsChange, saveSettings, type SiteBarSettings,
} from './site-bar.js';

type Key = keyof SiteBarSettings;
type Field =
  | { type: 'select'; key: Key; label: string; options: readonly (readonly [string, string])[]; when?: When }
  | { type: 'check'; key: Key; label: string; hint?: string; when?: When }
  | { type: 'range'; key: Key; label: string; min: number; max: number; step?: number; unit?: string; zero?: string; when?: When }
  | { type: 'color'; key: Key; label: string; nullable?: boolean; when?: When }
  | { type: 'visibility' };
type When = (settings: SiteBarSettings) => boolean;

const horizontal: When = (s) => s.position === 'top' || s.position === 'bottom';
const fieldsets: readonly { legend: string; note?: string; fields: readonly Field[] }[] = [
  {
    legend: 'Placement',
    fields: [
      { type: 'select', key: 'position', label: 'Edge', options: [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']] },
      { type: 'range', key: 'offset', label: 'Distance from the edge', min: 0, max: 48, unit: 'px' },
      { type: 'select', key: 'layout', label: 'Rows', options: [['row', 'One row'], ['wrap', 'Wrap in one pill'], ['rows', 'A pill per row']], when: horizontal },
      { type: 'check', key: 'sectionBar', label: 'Section bar', hint: 'A second bar with the sections of the group you are reading.' },
    ],
  },
  {
    legend: 'Items',
    fields: [
      { type: 'check', key: 'labels', label: 'Labels' },
      { type: 'check', key: 'settingsItem', label: 'Settings item' },
      { type: 'check', key: 'separateSettings', label: 'Settings in its own pill', when: (s) => s.settingsItem },
      { type: 'check', key: 'equalWidth', label: 'Equal widths' },
      { type: 'select', key: 'equalOverflow', label: "When equal widths don't fit", options: [['natural', 'Use natural widths'], ['truncate', 'Cut off labels'], ['grow', 'Make the bar wider']], when: (s) => s.equalWidth },
      { type: 'visibility' },
    ],
  },
  {
    legend: 'More',
    note: 'Groups that don’t fit move behind a More button.',
    fields: [
      { type: 'select', key: 'overflow', label: 'More', options: [['menu', 'Menu'], ['expand', 'Row of icons'], ['off', 'Off']] },
      { type: 'select', key: 'overflowSurface', label: 'Icons', options: [['shared', 'In one pill'], ['individual', 'Separate glass']], when: (s) => s.overflow === 'expand' },
      { type: 'range', key: 'maxVisible', label: 'Items before More', min: 0, max: 6, zero: 'As many as fit', when: (s) => s.overflow !== 'off' },
      { type: 'range', key: 'maxRows', label: 'Rows before More', min: 1, max: 3, when: (s) => s.overflow !== 'off' && s.layout !== 'row' && horizontal(s) },
    ],
  },
  {
    legend: 'Glass and color',
    fields: [
      { type: 'range', key: 'transparency', label: 'Transparency', min: 0, max: 100, unit: '%' },
      { type: 'select', key: 'background', label: 'Tint', options: [['theme', 'Theme glass'], ['solid', 'One color'], ['gradient', 'Gradient']] },
      { type: 'color', key: 'color', label: 'Tint color', when: (s) => s.background !== 'theme' },
      { type: 'color', key: 'color2', label: 'Second color', when: (s) => s.background === 'gradient' },
      { type: 'color', key: 'accent', label: 'Selected', nullable: true },
      { type: 'color', key: 'unselected', label: 'Unselected', nullable: true },
      { type: 'color', key: 'selectedIcon', label: 'Selected icon', nullable: true },
      { type: 'color', key: 'unselectedIcon', label: 'Unselected icon', nullable: true },
    ],
  },
  {
    legend: 'Motion and gestures',
    fields: [
      { type: 'check', key: 'magnify', label: 'Magnify under the pointer' },
      { type: 'range', key: 'magnifyScale', label: 'Magnify size', min: 1, max: 2, step: .05, unit: '×', when: (s) => s.magnify },
      { type: 'range', key: 'magnifyLift', label: 'Lift', min: 0, max: 24, unit: 'px', when: (s) => s.magnify },
      { type: 'range', key: 'magnifyRange', label: 'Reach', min: 40, max: 240, unit: 'px', when: (s) => s.magnify },
      { type: 'check', key: 'scrollCompact', label: 'Compact while scrolling down' },
      { type: 'range', key: 'compactThreshold', label: 'Scroll before it changes', min: 4, max: 80, unit: 'px', when: (s) => s.scrollCompact },
      { type: 'check', key: 'swipe', label: 'Swipe between items' },
      { type: 'check', key: 'reorderable', label: 'Let me reorder the groups', hint: 'Turn on, then drag the groups in the bar, or focus one and press Alt with an arrow key.' },
    ],
  },
  {
    legend: 'Contrast',
    fields: [
      { type: 'check', key: 'contrast', label: 'Readable over dark content', hint: 'Over the dark examples in the docs, icons and labels switch to a light color.' },
      { type: 'check', key: 'adaptiveTint', label: 'Add tint over busy content', when: (s) => s.contrast },
    ],
  },
];

let settings = loadSettings();
const bar = mountSiteBar('../', 'settings', settings);
const form = document.querySelector<HTMLFormElement>('#settings')!;
const status = document.querySelector<HTMLElement>('#settings-status')!;
const rows: { element: HTMLElement; when?: When; sync: () => void }[] = [];

function change(next: Partial<SiteBarSettings>): void {
  settings = { ...settings, ...next };
  saveSettings(settings);
  bar.update(settings);
  refresh();
  status.textContent = 'Saved.';
}

function refresh(): void {
  for (const row of rows) {
    row.element.hidden = row.when ? !row.when(settings) : false;
    row.sync();
  }
}

let fieldSequence = 0;
function field(spec: Exclude<Field, { type: 'visibility' }>): HTMLElement {
  const row = document.createElement('div');
  row.className = `ds-field ds-field--${spec.type}`;
  const id = `ds-${++fieldSequence}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = spec.label;
  let sync = (): void => {};
  if (spec.type === 'select') {
    const select = document.createElement('select');
    select.id = id;
    for (const [value, text] of spec.options) select.append(new Option(text, value));
    select.addEventListener('change', () => change({ [spec.key]: select.value } as Partial<SiteBarSettings>));
    sync = () => { select.value = String(settings[spec.key]); };
    row.append(label, select);
  } else if (spec.type === 'check') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.addEventListener('change', () => change({ [spec.key]: input.checked } as Partial<SiteBarSettings>));
    sync = () => { input.checked = settings[spec.key] === true; };
    row.append(input, label);
    if (spec.hint) {
      const hint = document.createElement('p');
      hint.className = 'ds-hint';
      hint.id = `${id}-hint`;
      hint.textContent = spec.hint;
      input.setAttribute('aria-describedby', hint.id);
      row.append(hint);
    }
  } else if (spec.type === 'range') {
    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.min = String(spec.min);
    input.max = String(spec.max);
    input.step = String(spec.step ?? 1);
    const output = document.createElement('output');
    output.htmlFor = id;
    const theme = spec.key === 'transparency' ? document.createElement('input') : undefined;
    const show = (): void => {
      const value = settings[spec.key];
      output.textContent = value === null ? 'Theme' : value === 0 && spec.zero ? spec.zero : `${value}${spec.unit ?? ''}`;
    };
    input.addEventListener('input', () => {
      change({ [spec.key]: Number(input.value) } as Partial<SiteBarSettings>);
    });
    sync = () => {
      const value = settings[spec.key];
      input.value = String(value ?? 40);
      if (theme) {
        theme.checked = value === null;
        input.disabled = value === null;
      }
      show();
    };
    row.append(label, input, output);
    if (theme) {
      const wrap = document.createElement('label');
      wrap.className = 'ds-inline';
      theme.type = 'checkbox';
      theme.addEventListener('change', () => change({ transparency: theme.checked ? null : Number(input.value) }));
      wrap.append(theme, 'Theme default');
      row.append(wrap);
    }
  } else {
    const input = document.createElement('input');
    input.type = 'color';
    input.id = id;
    input.addEventListener('input', () => change({ [spec.key]: input.value } as Partial<SiteBarSettings>));
    row.append(label, input);
    let theme: HTMLInputElement | undefined;
    if (spec.nullable) {
      const wrap = document.createElement('label');
      wrap.className = 'ds-inline';
      theme = document.createElement('input');
      theme.type = 'checkbox';
      const box = theme;
      box.addEventListener('change', () => change({ [spec.key]: box.checked ? null : input.value } as Partial<SiteBarSettings>));
      wrap.append(box, 'Theme default');
      row.append(wrap);
    }
    sync = () => {
      const value = settings[spec.key];
      input.value = typeof value === 'string' ? value : '#2152a5';
      input.disabled = value === null;
      if (theme) theme.checked = value === null;
    };
  }
  rows.push({ element: row, ...(spec.when ? { when: spec.when } : {}), sync });
  return row;
}

function visibilityTable(): HTMLElement {
  const table = document.createElement('table');
  table.className = 'ds-visibility';
  table.innerHTML = '<caption>Show for each item</caption><thead><tr><th scope="col">Item</th><th scope="col">Icon</th><th scope="col">Label</th></tr></thead>';
  const body = document.createElement('tbody');
  for (const [id, name] of [...groups.map((group) => [group.id, group.label] as const), ['settings', 'Settings'] as const]) {
    const row = document.createElement('tr');
    const head = document.createElement('th');
    head.scope = 'row';
    head.textContent = name;
    row.append(head);
    for (const part of ['icon', 'label'] as const) {
      const cell = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('aria-label', `${name} ${part}`);
      input.addEventListener('change', () => {
        const hidden = { ...settings.hidden, [id]: { ...settings.hidden[id], [part]: input.checked } };
        // Never hide both: an item with neither icon nor label disappears.
        const entry = hidden[id]!;
        if (entry.icon === false && entry.label === false) entry[part === 'icon' ? 'label' : 'icon'] = true;
        change({ hidden });
      });
      rows.push({ element: cell, sync: () => { input.checked = settings.hidden[id]?.[part] !== false; } });
      cell.append(input);
      row.append(cell);
    }
    body.append(row);
  }
  table.append(body);
  return table;
}

for (const group of fieldsets) {
  const set = document.createElement('fieldset');
  set.className = 'ds-group';
  const legend = document.createElement('legend');
  legend.textContent = group.legend;
  set.append(legend);
  if (group.note) {
    const note = document.createElement('p');
    note.className = 'ds-hint';
    note.textContent = group.note;
    set.append(note);
  }
  for (const spec of group.fields) set.append(spec.type === 'visibility' ? visibilityTable() : field(spec));
  form.append(set);
}
document.querySelector('#settings-reset')?.addEventListener('click', () => {
  settings = defaultSettings();
  saveSettings(settings);
  bar.update(settings);
  refresh();
  status.textContent = 'Restored the defaults.';
});
onSettingsChange((next) => {
  settings = next;
  bar.update(settings);
  refresh();
});
refresh();

const themeToggle = document.querySelector<HTMLButtonElement>('#theme');
if (themeToggle) themeButton(themeToggle);
