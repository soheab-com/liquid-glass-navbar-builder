import { createAnchoredPopover, mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import '@soheab-com/liquid-glass-navbar/navbar.css';
import './docs.css';
import { themeButton } from './theme.js';
import { reveal, slideIn } from './motion.js';
import {
  defaultSettings, groups, loadSettings, mountSiteBar, onSettingsChange, saveSettings, type SiteBarSettings, type TopicHoverMode,
} from './site-bar.js';

type Key = keyof SiteBarSettings;
type Field =
  | { type: 'select'; key: Key; label: string; options: readonly (readonly [string, string])[]; when?: When }
  | { type: 'check'; key: Key; label: string; hint?: string; when?: When }
  | { type: 'range'; key: Key; label: string; min: number; max: number; step?: number; unit?: string; zero?: string; when?: When }
  | { type: 'color'; key: Key; label: string; nullable?: boolean; when?: When }
  | { type: 'visibility' }
  | { type: 'topic-hover' };
type When = (settings: SiteBarSettings) => boolean;

const horizontal: When = (s) => s.position === 'top' || s.position === 'bottom';
const fieldsets: readonly { id: string; tab: string; legend: string; note?: string; fields: readonly Field[] }[] = [
  {
    id: 'placement', tab: 'Placement', legend: 'Placement',
    fields: [
      { type: 'select', key: 'position', label: 'Edge', options: [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']] },
      { type: 'range', key: 'offset', label: 'Distance from the edge', min: 0, max: 48, unit: 'px' },
      { type: 'select', key: 'layout', label: 'Rows', options: [['row', 'One row'], ['wrap', 'Wrap in one pill'], ['rows', 'A pill per row']], when: horizontal },
      { type: 'check', key: 'sectionBar', label: 'Section bar' },
    ],
  },
  {
    id: 'items', tab: 'Items', legend: 'Items',
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
    id: 'more', tab: 'Overflow', legend: 'More button',
    note: 'Groups that don’t fit move behind a More button.',
    fields: [
      { type: 'select', key: 'overflow', label: 'More', options: [['menu', 'Menu'], ['expand', 'Row of icons'], ['off', 'Off']] },
      { type: 'select', key: 'overflowTrigger', label: 'More button', options: [['more', 'Icon and label'], ['dots', 'Dots only (⋮)']], when: (s) => s.overflow !== 'off' },
      { type: 'check', key: 'keepMoreOpen', label: 'Keep More open while scrolling', when: (s) => s.overflow !== 'off' },
      { type: 'select', key: 'overflowSurface', label: 'Icons', options: [['shared', 'In one pill'], ['individual', 'Separate glass']], when: (s) => s.overflow === 'expand' },
      { type: 'range', key: 'maxVisible', label: 'Items before More', min: 0, max: 6, zero: 'As many as fit', when: (s) => s.overflow !== 'off' },
      { type: 'range', key: 'maxRows', label: 'Rows before More', min: 1, max: 3, when: (s) => s.overflow !== 'off' && s.layout !== 'row' && horizontal(s) },
    ],
  },
  {
    id: 'glass', tab: 'Glass', legend: 'Glass and color',
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
    id: 'motion', tab: 'Motion', legend: 'Motion and gestures',
    fields: [
      { type: 'check', key: 'magnify', label: 'Magnify under the pointer' },
      { type: 'range', key: 'magnifyScale', label: 'Magnify size', min: 1, max: 2, step: .05, unit: '×', when: (s) => s.magnify },
      { type: 'range', key: 'magnifyLift', label: 'Lift', min: 0, max: 24, unit: 'px', when: (s) => s.magnify },
      { type: 'range', key: 'magnifyRange', label: 'Reach', min: 40, max: 240, unit: 'px', when: (s) => s.magnify },
      { type: 'check', key: 'scrollCompact', label: 'Compact while scrolling down' },
      { type: 'range', key: 'compactThreshold', label: 'Scroll before it changes', min: 4, max: 80, unit: 'px', when: (s) => s.scrollCompact },
      { type: 'check', key: 'swipe', label: 'Swipe between items' },
      { type: 'topic-hover' },
      { type: 'check', key: 'animations', label: 'Smooth animations' },
      { type: 'check', key: 'reorderable', label: 'Let me reorder the groups' },
    ],
  },
  {
    id: 'contrast', tab: 'Contrast', legend: 'Contrast',
    fields: [
      { type: 'check', key: 'contrast', label: 'Readable over dark content' },
      { type: 'check', key: 'adaptiveTint', label: 'Add tint over busy content', when: (s) => s.contrast },
    ],
  },
];

/** What each setting does, the code that controls it (in backticks), and the docs section about it. */
const help: Partial<Record<Key | 'visibility', readonly [text: string, docs?: string]>> = {
  position: ['Which edge of the screen the bars sit on. At the top they go below this header. Option: `position`.', 'position'],
  offset: ['Space between the bar and the edge of the screen, or the header when the bar is at the top. CSS: `--lg-nav-offset`.', 'css'],
  layout: ['One row, rows inside one glass pill, or a separate pill per row. Applies to bars at the top or bottom. Option: `layout`.', 'rows'],
  sectionBar: ['A second bar beside the main one with the sections of the group you are reading. It is built from a second navbar.'],
  labels: ['Shows the text under each icon. Off shows icons only. Option: `labels`.', 'icons-labels'],
  settingsItem: ['Adds a link to this page to the bar.'],
  separateSettings: ['Puts Settings in a glass pill of its own, with a `data-navbar-section` group.', 'structure'],
  equalWidth: ['Makes every item as wide as the widest one, so the highlight is the same size everywhere. Option: `equalWidth`.', 'equal-width'],
  equalOverflow: ['What equal widths do when they don’t fit: go back to natural widths, cut labels off, or let the bar grow. Option: `equalWidthOverflow`.', 'equal-width'],
  visibility: ['Hide the icon or the label of one item. Attributes: `data-navbar-hide-icon` and `data-navbar-hide-label`, or `setItemVisibility()`.', 'icons-labels'],
  overflow: ['What happens to groups that don’t fit: a menu, a row of glass icons, or nothing (Off). Option: `overflow`.', 'more'],
  overflowTrigger: ['How the More button looks: an icon with the word More, or just a vertical ⋮ icon. Screen readers still hear “More”. Option: `overflow.trigger`.', 'more'],
  keepMoreOpen: ['Leaves More open when you scroll the page; only a tap outside it closes it. Turn it off to close More as soon as the page scrolls. Option: `overflow.closeOnScroll`.', 'more'],
  overflowSurface: ['For the row of icons: one shared glass pill, or a glass circle around each icon. Option: `overflow.surface`.', 'more'],
  maxVisible: ['Show at most this many groups before More, even when more would fit. Option: `overflow.maxVisible`.', 'more'],
  maxRows: ['With rows, how many rows to fill before the rest goes behind More. Option: `maxRows`.', 'rows'],
  transparency: ['How see-through the glass is, from solid (0%) to clear (100%). Theme default leaves it to the theme. Option: `transparency`.', 'look'],
  background: ['Tints the glass with one color or a gradient instead of the theme’s glass. Option: `background`.', 'look'],
  color: ['The color of the tint.', 'look'],
  color2: ['The second color of the gradient.', 'look'],
  accent: ['The color of the selected item, and of whatever the highlight covers while it moves. Option: `colors.selected`.', 'look'],
  unselected: ['The color of the other items. Option: `colors.unselected`.', 'look'],
  selectedIcon: ['A separate color for the selected item’s icon. Option: `colors.selectedIcon`.', 'look'],
  unselectedIcon: ['A separate color for the other items’ icons. Option: `colors.unselectedIcon`.', 'look'],
  magnify: ['Icons near your pointer or finger grow and rise, like the macOS Dock, and settle again as you move on. Option: `magnify`.', 'magnify'],
  magnifyScale: ['How large the icon under the pointer grows. Option: `magnify.scale`.', 'magnify'],
  magnifyLift: ['How far it rises away from the edge. Option: `magnify.lift`.', 'magnify'],
  magnifyRange: ['How far from the pointer neighbouring icons still react. Option: `magnify.range`.', 'magnify'],
  scrollCompact: ['Hides the labels while you scroll down and brings them back when you scroll up. Items behind More stay there. Option: `scrollCompact`.', 'scroll-compact'],
  compactThreshold: ['How far to scroll in one direction before the bar changes, so small reversals are ignored. Option: `scrollCompact.threshold`.', 'scroll-compact'],
  animations: ['Extra motion: items glide when they move, popovers open on a spring, tabs squish when pressed and icons bounce when selected, badges pop, and the section bar slides between groups. Off without Reduce Motion too. Option: `animations`.', 'animations'],
  swipe: ['Slide along the bar to move the highlight, and lift to choose. Off adds `data-navbar-no-swipe`; taps still work.', 'swiping'],
  reorderable: ['Lets you change the order of the groups by dragging, or with Alt and an arrow key. Option: `reorderable` with `setReorderMode()`.', 'reordering'],
  contrast: ['Over content marked dark, icons and labels switch to a readable light color, even with clear glass. Option: `contrast`.', 'contrast'],
  adaptiveTint: ['Adds tint over busy content such as photos and clears it again over quiet content. Option: `contrast.adaptiveTint`.', 'contrast'],
};

/** The explanation: text with code in backticks, and a link to the docs section. */
function helpBody([text, docs]: readonly [string, string?], className: string): HTMLElement {
  const body = document.createElement('div');
  body.className = className;
  const paragraph = document.createElement('p');
  text.split('`').forEach((part, index) => {
    if (!part) return;
    if (index % 2) {
      const code = document.createElement('code');
      code.textContent = part;
      paragraph.append(code);
    } else paragraph.append(part);
  });
  body.append(paragraph);
  if (docs) {
    const link = document.createElement('a');
    link.href = `../#${docs}`;
    link.textContent = 'Read more in the docs';
    body.append(link);
  }
  return body;
}

/** A small ⓘ button that explains a setting: on hover with a mouse, on tap on a touch screen. */
function helpButton(key: Key | 'visibility', name: string): HTMLButtonElement | undefined {
  const entry = help[key];
  if (!entry) return undefined;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ds-help';
  button.setAttribute('aria-label', `About ${name}`);
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>';
  const body = helpBody(entry, 'ds-help-text');
  const popover = createAnchoredPopover(button, body, { label: `About ${name}`, className: 'ds-help-popover', closeOnSelect: false, spring: true });
  // A mouse opens it on hover; touch and keyboard use the click the popover already handles.
  let leave = 0;
  const stay = (): void => { clearTimeout(leave); };
  const away = (): void => { clearTimeout(leave); leave = window.setTimeout(() => popover.hide(), 160); };
  button.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') { stay(); popover.show(); } });
  button.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') away(); });
  popover.element.addEventListener('pointerenter', stay);
  popover.element.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') away(); });
  // A mouse click on an already open (hovered) popover would close it again; keep it open instead.
  button.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && popover.open) {
      event.preventDefault();
      button.addEventListener('click', (click) => { click.stopImmediatePropagation(); }, { once: true, capture: true });
    }
  });
  return button;
}

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

let firstRefresh = true;
function refresh(): void {
  for (const row of rows) {
    const show = row.when ? row.when(settings) : true;
    // Settings that appear or disappear because of another choice ease in and out.
    if (firstRefresh || !settings.animations) row.element.hidden = !show;
    else reveal(row.element, show);
    row.sync();
  }
  firstRefresh = false;
}

let fieldSequence = 0;
function field(spec: Exclude<Field, { type: 'visibility' | 'topic-hover' }>): HTMLElement {
  const row = document.createElement('div');
  row.className = `ds-field ds-field--${spec.type}`;
  const id = `ds-${++fieldSequence}`;
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = spec.label;
  // The name and its ⓘ button; the button sits outside the label so tapping it never toggles the control.
  const name = document.createElement('span');
  name.className = 'ds-name';
  name.append(label);
  const about = helpButton(spec.key, spec.label);
  if (about) name.append(about);
  let sync = (): void => {};
  if (spec.type === 'select') {
    const select = document.createElement('select');
    select.id = id;
    for (const [value, text] of spec.options) select.append(new Option(text, value));
    select.addEventListener('change', () => change({ [spec.key]: select.value } as Partial<SiteBarSettings>));
    sync = () => { select.value = String(settings[spec.key]); };
    row.append(name, select);
  } else if (spec.type === 'check') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.addEventListener('change', () => change({ [spec.key]: input.checked } as Partial<SiteBarSettings>));
    sync = () => { input.checked = settings[spec.key] === true; };
    row.append(input, name);
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
    row.append(name, input, output);
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
    row.append(name, input);
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
  // On wide screens the explanation sits beside the control; on phones it's behind the ⓘ button.
  const setting = document.createElement('div');
  setting.className = 'ds-setting';
  setting.append(row);
  const entry = help[spec.key];
  if (entry) setting.append(helpBody(entry, 'ds-desc'));
  rows.push({ element: setting, ...(spec.when ? { when: spec.when } : {}), sync });
  return setting;
}

function visibilityTable(): HTMLElement {
  const table = document.createElement('table');
  table.className = 'ds-visibility';
  table.innerHTML = '<caption><span class="ds-name"><span>Show for each item</span></span></caption><thead><tr><th scope="col">Item</th><th scope="col">Icon</th><th scope="col">Label</th></tr></thead>';
  const about = helpButton('visibility', 'showing icons and labels');
  if (about) table.querySelector('caption .ds-name')?.append(about);
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

function topicHoverSettings(): HTMLElement {
  const group = document.createElement('div');
  group.className = 'ds-setting';
  group.innerHTML = `<div class="ds-field"><label for="ds-hover-topic">Topic</label><select id="ds-hover-topic"></select></div>
    <div class="ds-field"><label for="ds-hover-mode">On hover</label><select id="ds-hover-mode">
      <option value="preview">Preview and return</option><option value="keep">Scroll and keep</option><option value="off">Off</option>
    </select></div>`;
  const topic = group.querySelector<HTMLSelectElement>('#ds-hover-topic')!;
  const mode = group.querySelector<HTMLSelectElement>('#ds-hover-mode')!;
  for (const sectionGroup of groups) {
    const choices = document.createElement('optgroup');
    choices.label = sectionGroup.label;
    for (const [id, label] of sectionGroup.sections) choices.append(new Option(label, id));
    topic.append(choices);
  }
  const sync = () => { mode.value = settings.topicHover[topic.value] ?? 'preview'; };
  topic.addEventListener('change', sync);
  mode.addEventListener('change', () => {
    const topicHover = { ...settings.topicHover };
    if (mode.value === 'preview') delete topicHover[topic.value];
    else topicHover[topic.value] = mode.value as TopicHoverMode;
    change({ topicHover });
  });
  rows.push({ element: group, when: (s) => s.sectionBar, sync });
  return group;
}

// One panel per group, chosen with a tab bar that is the navbar itself (swipe between groups, too).
const panels = new Map<string, HTMLElement>();
for (const group of fieldsets) {
  const set = document.createElement('fieldset');
  set.className = 'ds-group';
  set.id = `panel-${group.id}`;
  set.setAttribute('aria-labelledby', `tab-${group.id}`);
  const legend = document.createElement('legend');
  legend.textContent = group.legend;
  set.append(legend);
  if (group.note) {
    const note = document.createElement('p');
    note.className = 'ds-hint';
    note.textContent = group.note;
    set.append(note);
  }
  for (const spec of group.fields) {
    if (spec.type === 'visibility') set.append(visibilityTable());
    else if (spec.type === 'topic-hover') set.append(topicHoverSettings());
    else set.append(field(spec));
  }
  form.append(set);
  panels.set(group.id, set);
}

const tabBar = document.querySelector<HTMLElement>('#settings-tabs')!;
for (const group of fieldsets) {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.id = `tab-${group.id}`;
  tab.dataset.panel = group.id;
  tab.setAttribute('aria-controls', `panel-${group.id}`);
  const label = document.createElement('span');
  label.setAttribute('data-navbar-label', '');
  label.textContent = group.tab;
  tab.append(label);
  tabBar.append(tab);
}
let shownPanel = '';
function showPanel(id: string, focus = false): void {
  const chosen = panels.has(id) ? id : fieldsets[0]!.id;
  const order = fieldsets.map((group) => group.id);
  const direction = shownPanel ? Math.sign(order.indexOf(chosen) - order.indexOf(shownPanel)) : 0;
  for (const [key, panel] of panels) panel.hidden = key !== chosen;
  // The new panel slides in from the side of its tab.
  if (direction && settings.animations) slideIn(panels.get(chosen)!, direction);
  shownPanel = chosen;
  for (const tab of tabBar.querySelectorAll<HTMLButtonElement>('button[data-panel]')) {
    if (tab.dataset.panel === chosen) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  if (location.hash.slice(1) !== chosen) history.replaceState(null, '', `#${chosen}`);
  if (focus) panels.get(chosen)?.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true });
}
showPanel(location.hash.slice(1));
const tabs = mountLiquidGlassNavbar(tabBar, {
  overflow: true,
  onSelect(item) {
    showPanel(item.dataset.panel ?? '', false);
  },
});
addEventListener('hashchange', () => {
  showPanel(location.hash.slice(1));
  tabs.sync();
});

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
