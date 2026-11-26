import type { LiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import '@soheab-com/liquid-glass-navbar/navbar.css';
import highlight from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { icons, type IconName } from '../icons.js';
import './docs.css';
import { glideFrom, reveal, reducedMotion } from './motion.js';
import { themeButton } from './theme.js';
import type { Example } from './example.js';
import { groups, loadSettings, mountSiteBar, onSettingsChange } from './site-bar.js';
import * as animationsExample from './examples/animations.js';
import animationsSource from './examples/animations.ts?raw';
import * as badges from './examples/badges.js';
import badgesSource from './examples/badges.ts?raw';
import * as compact from './examples/compact.js';
import compactSource from './examples/compact.ts?raw';
import * as context from './examples/context.js';
import contextSource from './examples/context.ts?raw';
import * as contrast from './examples/contrast.js';
import contrastSource from './examples/contrast.ts?raw';
import * as refraction from './examples/refraction.js';
import refractionSource from './examples/refraction.ts?raw';
import * as equal from './examples/equal.js';
import equalSource from './examples/equal.ts?raw';
import * as hero from './examples/hero.js';
import heroSource from './examples/hero.ts?raw';
import * as look from './examples/look.js';
import lookSource from './examples/look.ts?raw';
import * as magnify from './examples/magnify.js';
import magnifySource from './examples/magnify.ts?raw';
import * as more from './examples/more.js';
import moreSource from './examples/more.ts?raw';
import * as persistence from './examples/persistence.js';
import persistenceSource from './examples/persistence.ts?raw';
import * as popover from './examples/popover.js';
import popoverSource from './examples/popover.ts?raw';
import * as position from './examples/position.js';
import positionSource from './examples/position.ts?raw';
import * as quickstart from './examples/quickstart.js';
import quickstartSource from './examples/quickstart.ts?raw';
import * as reorder from './examples/reorder.js';
import reorderSource from './examples/reorder.ts?raw';
import * as rows from './examples/rows.js';
import rowsSource from './examples/rows.ts?raw';
import * as structure from './examples/structure.js';
import structureSource from './examples/structure.ts?raw';
import * as swipe from './examples/swipe.js';
import swipeSource from './examples/swipe.ts?raw';
import * as visibility from './examples/visibility.js';
import visibilitySource from './examples/visibility.ts?raw';

const releaseBadge = document.querySelector<HTMLElement>('[data-release-published]');
if (releaseBadge) {
  const published = Date.parse(releaseBadge.dataset.releasePublished ?? '');
  const expires = published + 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now >= published && now < expires) {
    releaseBadge.hidden = false;
    setTimeout(() => { releaseBadge.hidden = true; }, expires - now);
  }
}

highlight.registerLanguage('html', xml);
highlight.registerLanguage('ts', typescript);

// ---- Markup for the examples. The HTML tab shows exactly what is mounted. ----

type Value = string | number | boolean;
type State = Record<string, Value>;
interface ItemSpec {
  label: string;
  icon?: IconName;
  attrs?: Record<string, string | true>;
}

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function itemHtml(item: ItemSpec, indent: string): string {
  const attrs = ['type="button"'];
  for (const [name, value] of Object.entries(item.attrs ?? {})) attrs.push(value === true ? name : `${name}="${escape(value)}"`);
  const lines = [`${indent}<button ${attrs.join(' ')}>`];
  if (item.icon) lines.push(`${indent}  <svg data-navbar-icon viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[item.icon]}" /></svg>`);
  lines.push(`${indent}  <span data-navbar-label>${escape(item.label)}</span>`, `${indent}</button>`);
  return lines.join('\n');
}

function navHtml(groupsOfItems: ItemSpec[][], sectionAttrs: (index: number) => Record<string, string | true> = () => ({})): string {
  const body = groupsOfItems.length === 1
    ? groupsOfItems[0]!.map((item) => itemHtml(item, '  '))
    : groupsOfItems.map((group, index) => {
      const attrs = Object.entries(sectionAttrs(index)).map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${value}"`)).join('');
      return `  <div data-navbar-section${attrs}>\n${group.map((item) => itemHtml(item, '    ')).join('\n')}\n  </div>`;
    });
  return `<nav aria-label="Main">\n${body.join('\n')}\n</nav>`;
}

const tab = (label: string, icon: IconName, attrs: ItemSpec['attrs'] = {}): ItemSpec => ({ label, icon, attrs });
const current = { 'aria-current': 'page' } as const;
const action = { 'data-navbar-action': true } as const;
const search = (): ItemSpec => tab('Search', 'search', { ...action, 'aria-label': 'Search', 'data-navbar-hide-label': true });
const basic = (): ItemSpec[] => [tab('Home', 'home', current), tab('Schedule', 'calendar'), tab('Map', 'map'), tab('Saved', 'heart')];
const many = (count: number): ItemSpec[] => [
  tab('Home', 'home', current), tab('Schedule', 'calendar'), tab('Map', 'map'), tab('Saved', 'heart'), tab('Chats', 'chat'),
  tab('Alerts', 'bell'), tab('Music', 'music'), tab('Photos', 'camera'), tab('Shop', 'cart'), tab('Profile', 'person'),
  tab('Settings', 'gear'), tab('Starred', 'star'),
].slice(0, count);

// ---- Showing an example's real source ----

type Nested = { [key: string]: Value | Nested };

/** Dotted state keys (`overflow.style`) become nested objects, the shape the examples' typed values have. */
function nested(state: State): Nested {
  const result: Nested = {};
  for (const [key, value] of Object.entries(state)) {
    const path = key.split('.');
    // Inside an option object, 0 and empty mean "not set": leave them out, as the code tab does.
    if (path.length > 1 && (value === 0 || value === '')) continue;
    let node = result;
    for (const part of path.slice(0, -1)) node = (node[part] ??= {}) as Nested;
    node[path[path.length - 1]!] = value;
  }
  return result;
}

/** An object literal for the code tab; 0 and empty values are left out, the same as leaving the option unset. */
function objectLiteral(value: Nested): string {
  const entries = Object.entries(value).filter(([, entry]) => entry !== 0 && entry !== '');
  return `{ ${entries.map(([key, entry]) => `${key}: ${typeof entry === 'object' ? objectLiteral(entry) : literal(entry)}`).join(', ')} }`;
}

const literal = (value: Value): string => (typeof value === 'string' ? `'${value.replaceAll("'", "\\'")}'` : String(value));

/**
 * The TypeScript tab: the example module's own imports and the code between its `#region` markers, verbatim,
 * after the lines that find the elements it uses and the controls' current values.
 */
function exampleCode(source: string, state: State): string {
  const lines = source.split('\n');
  const imports = lines.filter((line) => line.startsWith('import ') && !line.includes("'../"));
  const start = lines.findIndex((line) => line.trim() === '// #region');
  const end = lines.findIndex((line) => line.trim() === '// #endregion');
  const region = lines.slice(start + 1, end);
  const indent = Math.min(...region.filter((line) => line.trim()).map((line) => line.length - line.trimStart().length));
  const body = region.map((line) => line.slice(indent)).join('\n');
  const uses = (name: string): boolean => new RegExp(`\\b${name}\\b`).test(body);
  const prelude = [...imports, "import '@soheab-com/liquid-glass-navbar/navbar.css';", ''];
  prelude.push("const nav = document.querySelector<HTMLElement>('nav')!;");
  if (uses('stage')) prelude.push("const stage = document.querySelector<HTMLElement>('.example')!;");
  if (uses('output')) prelude.push("const output = document.querySelector('output')!;");
  // The example's values: each one it uses becomes a const typed like the example (with the navbar's own types).
  const signature = /Example<\{ (.*) \}>/.exec(source)?.[1] ?? '';
  const members = signature.split('; ').map((member) => {
    const colon = member.indexOf(': ');
    return [member.slice(0, colon), member.slice(colon + 2)] as const;
  }).filter(([name]) => name && uses(name));
  const values = nested(state);
  if (members.length) prelude.push('');
  for (const [name, type] of members) {
    const value = values[name];
    const plain = ['boolean', 'number', 'string'].includes(type);
    prelude.push(`const ${name}${plain ? '' : `: ${type}`} = ${typeof value === 'object' ? objectLiteral(value) : literal(value as Value)};`);
  }
  return `${prelude.join('\n')}\n\n${body}`;
}

// ---- The demo engine ----

type Control =
  | { key: string; label: string; type: 'select'; options: readonly (readonly [string, string])[] }
  | { key: string; label: string; type: 'check' }
  | { key: string; label: string; type: 'range'; min: number; max: number; step?: number; unit?: string; zero?: string }
  | { key: string; label: string; type: 'color' };

interface Demo {
  state: State;
  controls?: readonly Control[];
  /** Stage look and behaviour. `width` adds a width slider (percent of the card). */
  stage?: { height?: number; backdrop?: 'photo' | 'aurora' | 'plain' | 'stories'; width?: boolean; scroll?: string };
  html: (state: State) => string;
  example: { run: Example<never> };
  source: string;
  /** Buttons under the stage. */
  actions?: readonly { label: string; run: (remount: () => void, output: HTMLOutputElement) => void }[];
}

const n = (state: State, key: string): number => Number(state[key]);
const b = (state: State, key: string): boolean => state[key] === true;

/** Builds a demo card right away (so the page keeps its height) and returns the function that mounts the bar. */
function mountDemo(host: HTMLElement, demo: Demo, id: string): () => void {
  const defaults: State = { ...demo.state };
  // Your changes to an example are kept in this browser (only for controls the example still has).
  const storageKey = `lg-navbar-docs:example:${id}`;
  const saved = ((): State => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}') as State; } catch { return {}; }
  })();
  const state: State = { ...defaults };
  for (const [key, value] of Object.entries(saved)) {
    if (key === 'codeTab') continue;
    if (key in defaults || key === 'width') state[key] = value;
  }
  const persist = (): void => {
    try { localStorage.setItem(storageKey, JSON.stringify({ ...state, codeTab })); } catch { /* Not saved; it still works. */ }
  };
  // On a phone the card is already narrow, so width demos start at full width.
  if (demo.stage?.width && (state.width === undefined || matchMedia('(max-width: 700px)').matches)) state.width = 100;
  const card = document.createElement('div');
  card.className = 'dd-card';
  const stage = document.createElement('div');
  stage.className = `dd-stage dd-stage--${demo.stage?.backdrop ?? 'photo'} example`;
  if (demo.stage?.height) stage.style.height = `${demo.stage.height}px`;
  const frame = document.createElement('div');
  frame.className = 'dd-frame';
  frame.append(stage);
  const output = document.createElement('output');
  output.className = 'dd-log';
  output.setAttribute('aria-live', 'polite');
  const controls = document.createElement('div');
  controls.className = 'dd-controls';
  const code = document.createElement('div');
  code.className = 'dd-code';
  card.append(frame, controls, output, code);
  host.replaceChildren(card);

  let navbar: LiquidGlassNavbar | undefined;
  let codeTab: 'ts' | 'html' = saved.codeTab === 'html' ? 'html' : 'ts';

  function render(): void {
    // Where each tab was, so the new bar can glide from there instead of jumping.
    const before = new Map<string, DOMRect>();
    for (const item of stage.querySelectorAll<HTMLElement>('nav button, nav a')) {
      const key = item.getAttribute('aria-label') ?? item.textContent?.trim() ?? '';
      if (key && item.getClientRects().length && !item.closest('.lg-popover')) before.set(key, item.getBoundingClientRect());
    }
    navbar?.destroy();
    stage.replaceChildren();
    if (demo.stage?.scroll) {
      const scroller = document.createElement('div');
      scroller.className = 'dd-scroll feed';
      scroller.innerHTML = demo.stage.scroll;
      stage.append(scroller);
    }
    const dock = document.createElement('div');
    dock.className = 'dd-dock';
    const holder = document.createElement('template');
    holder.innerHTML = demo.html(state);
    const nav = holder.content.firstElementChild;
    if (!(nav instanceof HTMLElement)) return;
    dock.append(nav);
    stage.append(dock);
    frame.style.width = demo.stage?.width ? `${n(state, 'width')}%` : '';
    navbar = demo.example.run({ nav, stage, output, controls: nested(state) as never });
    if (before.size) {
      glideFrom(before, [...nav.querySelectorAll<HTMLElement>(':scope button, :scope a')]
        .filter((item) => item.getClientRects().length && !item.closest('.lg-popover'))
        .map((item) => [item.getAttribute('aria-label') ?? item.textContent?.trim() ?? '', item] as [string, HTMLElement]));
    }
    renderCode();
  }

  function renderCode(): void {
    const text = codeTab === 'ts' ? exampleCode(demo.source, state) : demo.html(state);
    code.innerHTML = `<div class="dd-code-head" role="tablist" aria-label="Code">
      <button type="button" role="tab" data-tab="ts" aria-selected="${codeTab === 'ts'}">TypeScript</button>
      <button type="button" role="tab" data-tab="html" aria-selected="${codeTab === 'html'}">HTML</button>
      <button type="button" class="dd-copy">Copy</button></div>
      <pre tabindex="0"><code>${highlight.highlight(text, { language: codeTab }).value}</code></pre>`;
    for (const button of code.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
      button.addEventListener('click', () => { codeTab = button.dataset.tab === 'html' ? 'html' : 'ts'; persist(); renderCode(); });
    }
    code.querySelector('.dd-copy')?.addEventListener('click', async (event) => {
      await navigator.clipboard.writeText(text);
      (event.currentTarget as HTMLButtonElement).textContent = 'Copied';
    });
  }

  const all: Control[] = [...(demo.controls ?? [])];
  if (demo.stage?.width) all.push({ key: 'width', label: 'Width', type: 'range', min: 35, max: 100, unit: '%' });
  for (const control of all) {
    const wrapper = document.createElement('label');
    wrapper.className = `dd-control dd-control--${control.type}`;
    let input: HTMLInputElement | HTMLSelectElement;
    if (control.type === 'select') {
      input = document.createElement('select');
      for (const [value, text] of control.options) input.append(new Option(text, value));
      input.value = String(state[control.key]);
    } else {
      input = document.createElement('input');
      input.type = control.type === 'check' ? 'checkbox' : control.type;
      if (control.type === 'check') input.checked = b(state, control.key);
      else input.value = String(state[control.key]);
      if (control.type === 'range') {
        input.min = String(control.min);
        input.max = String(control.max);
        input.step = String(control.step ?? 1);
      }
    }
    input.dataset.key = control.key;
    const value = document.createElement('span');
    value.className = 'dd-value';
    const show = (): void => {
      if (control.type === 'range') value.textContent = state[control.key] === 0 && control.zero ? control.zero : `${state[control.key]}${control.unit ?? ''}`;
    };
    show();
    input.addEventListener('sync', show);
    const apply = (): void => {
      state[control.key] = input instanceof HTMLInputElement && input.type === 'checkbox' ? input.checked
        : control.type === 'range' ? Number(input.value) : input.value;
      show();
      persist();
      resetButton.hidden = !changed();
      if (control.key === 'width') frame.style.width = `${n(state, 'width')}%`;
      else render();
    };
    input.addEventListener(control.type === 'range' || control.type === 'color' ? 'input' : 'change', apply);
    const text = document.createElement('span');
    text.textContent = control.label;
    if (control.type === 'check') wrapper.append(input, text);
    else wrapper.append(text, input, value);
    controls.append(wrapper);
  }
  // Reset brings back the example's own values (and forgets what was saved).
  const changed = (): boolean => Object.keys(defaults).some((key) => state[key] !== defaults[key])
    || (demo.stage?.width === true && state.width !== (defaults.width ?? 100));
  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'dd-action dd-reset';
  resetButton.textContent = 'Reset';
  resetButton.addEventListener('click', () => {
    try { localStorage.removeItem(storageKey); } catch { /* Nothing saved. */ }
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, defaults);
    if (demo.stage?.width && (state.width === undefined || matchMedia('(max-width: 700px)').matches)) state.width = 100;
    for (const input of controls.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-key]')) {
      const value = state[input.dataset.key ?? ''];
      if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = value === true;
      else input.value = String(value);
      input.dispatchEvent(new Event('sync'));
    }
    resetButton.hidden = true;
    frame.style.width = demo.stage?.width ? `${n(state, 'width')}%` : '';
    render();
  });
  for (const entry of demo.actions ?? []) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dd-action';
    button.textContent = entry.label;
    button.addEventListener('click', () => entry.run(render, output));
    controls.append(button);
  }
  if (all.length) {
    resetButton.hidden = !changed();
    controls.append(resetButton);
  }
  if (!controls.childElementCount) controls.remove();
  frame.style.width = demo.stage?.width ? `${n(state, 'width')}%` : '';
  renderCode();
  return render;
}

// ---- The demos: markup, controls and the example module each one runs ----

const stories = `
  <article data-navbar-backdrop="busy"><div class="dd-photo" data-navbar-backdrop="dark busy"></div><h3>Where the water meets the mountains</h3><p>At first light the lake mirrors the peaks. Follow the shoreline past the cabins and watch the colors change as the sun rises.</p></article>
  <article><h3>Across the meadow</h3><p>Morning mist hangs above the field. Take the trail along the trees for a view of the valley.</p><p>Stay on the ridge as the path curves back toward the lake.</p></article>
  <article class="dd-night" data-navbar-backdrop="dark"><h3>After sunset</h3><p>The last ferry leaves the harbor as the lights come on. On the walk back, the bright windows reflect in the water.</p></article>
  <article><h3>The long way home</h3><p>The path stays close to the shoreline until it reaches the main road.</p><p>Cabins worth a detour line the last stretch.</p></article>`;

const demos: Record<string, Demo> = {
  hero: {
    state: {},
    stage: { height: 260 },
    html: () => navHtml([basic(), [search()]]),
    example: hero, source: heroSource,
  },
  quickstart: {
    state: {},
    stage: { height: 200, backdrop: 'aurora' },
    html: () => navHtml([basic().slice(0, 3)]),
    example: quickstart, source: quickstartSource,
  },
  structure: {
    state: { sections: true, search: true, labels: true },
    controls: [
      { key: 'sections', label: 'Separate sections', type: 'check' },
      { key: 'search', label: 'Search action', type: 'check' },
      { key: 'labels', label: 'Labels', type: 'check' },
    ],
    stage: { height: 200 },
    html: (state) => navHtml(b(state, 'search')
      ? (b(state, 'sections') ? [basic().slice(0, 3), [search()]] : [[...basic().slice(0, 3), search()]])
      : [basic().slice(0, 3)]),
    example: structure, source: structureSource,
  },
  position: {
    state: { position: 'bottom' },
    controls: [{ key: 'position', label: 'Position', type: 'select', options: [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right'], ['', 'Placed by your layout']] }],
    stage: { height: 300 },
    html: () => navHtml([basic()]),
    example: position, source: positionSource,
  },
  look: {
    state: { theme: 'light', 'colors.selected': '#2152a5', 'colors.unselected': '#293b60', tint: 'theme', transparency: 40 },
    controls: [
      { key: 'theme', label: 'Theme', type: 'select', options: [['light', 'Light'], ['dark', 'Dark']] },
      { key: 'colors.selected', label: 'Selected', type: 'color' },
      { key: 'colors.unselected', label: 'Unselected', type: 'color' },
      { key: 'tint', label: 'Background', type: 'select', options: [['theme', 'Theme glass'], ['solid', 'Solid tint'], ['gradient', 'Gradient']] },
      { key: 'transparency', label: 'Transparency', type: 'range', min: 0, max: 100, unit: '%' },
    ],
    stage: { height: 220 },
    html: () => navHtml([basic()]),
    example: look, source: lookSource,
  },
  equal: {
    state: { equalWidth: true, equalWidthOverflow: 'natural', long: false },
    controls: [
      { key: 'equalWidth', label: 'Equal width', type: 'check' },
      { key: 'equalWidthOverflow', label: "When it doesn't fit", type: 'select', options: [['natural', 'Natural widths'], ['truncate', 'Cut off labels'], ['grow', 'Grow the bar']] },
      { key: 'long', label: 'Long label', type: 'check' },
    ],
    stage: { height: 200, width: true },
    html: (state) => navHtml([[tab('Home', 'home', current), tab(b(state, 'long') ? 'Upcoming appointments' : 'Schedule', 'calendar'), tab('Map', 'map')]]),
    example: equal, source: equalSource,
  },
  visibility: {
    state: { 'visibility.icon': true, 'visibility.label': true },
    controls: [{ key: 'visibility.icon', label: 'Map icon', type: 'check' }, { key: 'visibility.label', label: 'Map label', type: 'check' }],
    stage: { height: 200, backdrop: 'aurora' },
    html: () => navHtml([[tab('Home', 'home', current), tab('Schedule', 'calendar'), tab('Map', 'map', { 'aria-label': 'Map' })]]),
    example: visibility, source: visibilitySource,
  },
  swipe: {
    state: { optOut: false },
    controls: [{ key: 'optOut', label: 'Keep the Search section out of swipes', type: 'check' }],
    stage: { height: 200 },
    html: () => navHtml([basic(), [search()]]),
    example: swipe, source: swipeSource,
  },
  reorder: {
    state: { editing: false },
    controls: [{ key: 'editing', label: 'Edit (drag to reorder)', type: 'check' }],
    stage: { height: 200 },
    html: () => navHtml([basic()]),
    example: reorder, source: reorderSource,
  },
  magnify: {
    state: { 'magnify.scale': 1.4, 'magnify.lift': 10, 'magnify.range': 110, position: 'bottom' },
    controls: [
      { key: 'magnify.scale', label: 'Scale', type: 'range', min: 1, max: 2, step: .05 },
      { key: 'magnify.lift', label: 'Lift', type: 'range', min: 0, max: 24, unit: 'px' },
      { key: 'magnify.range', label: 'Range', type: 'range', min: 40, max: 240, unit: 'px' },
      { key: 'position', label: 'Position', type: 'select', options: [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']] },
    ],
    stage: { height: 320 },
    html: () => navHtml([many(6)]),
    example: magnify, source: magnifySource,
  },
  rows: {
    state: { layout: 'wrap', count: 8, pin: false, width: 55 },
    controls: [
      { key: 'layout', label: 'Layout', type: 'select', options: [['wrap', 'Wrap in one pill'], ['rows', 'A pill per row'], ['row', 'One row']] },
      { key: 'count', label: 'Items', type: 'range', min: 3, max: 12 },
      { key: 'pin', label: 'Settings on row 1', type: 'check' },
    ],
    stage: { height: 260, width: true },
    html: (state) => navHtml([many(n(state, 'count')).map((item) => (b(state, 'pin')
      ? { ...item, attrs: { ...item.attrs, 'data-navbar-row': item.label === 'Settings' ? '1' : '2' } } : item))]),
    example: rows, source: rowsSource,
  },
  more: {
    state: { 'overflow.style': 'menu', 'overflow.trigger': 'more', 'overflow.surface': 'shared', layout: 'row', maxRows: 2, 'overflow.maxVisible': 0, count: 12, width: 60 },
    controls: [
      { key: 'overflow.style', label: 'More', type: 'select', options: [['menu', 'Menu'], ['expand', 'Row of icons']] },
      { key: 'overflow.trigger', label: 'Button', type: 'select', options: [['more', 'Icon and label'], ['dots', 'Dots only (⋮)']] },
      { key: 'overflow.surface', label: 'Icons', type: 'select', options: [['shared', 'One pill'], ['individual', 'Separate glass']] },
      { key: 'layout', label: 'Layout', type: 'select', options: [['row', 'One row'], ['wrap', 'Wrap'], ['rows', 'Pill per row']] },
      { key: 'maxRows', label: 'Max rows', type: 'range', min: 1, max: 3 },
      { key: 'overflow.maxVisible', label: 'Max visible', type: 'range', min: 0, max: 8, zero: 'Fit' },
      { key: 'count', label: 'Items', type: 'range', min: 4, max: 12 },
    ],
    stage: { height: 330, width: true },
    html: (state) => navHtml([many(n(state, 'count'))]),
    example: more, source: moreSource,
  },
  popover: {
    state: { placement: 'auto' },
    controls: [{ key: 'placement', label: 'Placement', type: 'select', options: [['auto', 'Auto'], ['above', 'Above'], ['below', 'Below']] }],
    stage: { height: 300 },
    html: () => navHtml([[tab('Notes', 'star', current), tab('Chats', 'chat')], [tab('Create', 'plus', { ...action, id: 'create' })]]),
    example: popover, source: popoverSource,
  },
  badges: {
    state: { chats: 3, dot: true, status: 'warning' },
    controls: [
      { key: 'chats', label: 'Chats', type: 'range', min: 0, max: 120 },
      { key: 'dot', label: 'Alerts dot', type: 'check' },
      { key: 'status', label: 'Sync status', type: 'select', options: [['', 'None'], ['info', 'Info'], ['success', 'Success'], ['warning', 'Warning'], ['error', 'Error']] },
    ],
    stage: { height: 200, backdrop: 'aurora' },
    html: () => navHtml([[tab('Home', 'home', current), tab('Chats', 'chat'), tab('Alerts', 'bell'), tab('Sync', 'gear')]]),
    example: badges, source: badgesSource,
  },
  compact: {
    state: { threshold: 16 },
    controls: [{ key: 'threshold', label: 'Threshold', type: 'range', min: 4, max: 80, unit: 'px' }],
    stage: { height: 320, backdrop: 'stories', scroll: stories },
    html: () => navHtml([basic()]),
    example: compact, source: compactSource,
  },
  context: {
    state: { placement: 'replace', back: true, ownLook: false },
    controls: [
      { key: 'placement', label: 'Placement', type: 'select', options: [['replace', 'Replace the navigation'], ['start', 'Before it'], ['end', 'After it'], ['section', 'Replace one section']] },
      { key: 'back', label: 'Back item', type: 'check' },
      { key: 'ownLook', label: 'Own look', type: 'check' },
    ],
    stage: { height: 300, backdrop: 'plain', scroll: '<p class="dd-hint">Select files to show actions for them.</p><ul class="files"><li><button type="button" aria-pressed="false">Brief.pdf</button></li><li><button type="button" aria-pressed="false">Notes.md</button></li><li><button type="button" aria-pressed="false">Draft.png</button></li></ul>' },
    html: () => navHtml([[tab('Home', 'home'), tab('Files', 'calendar', current), tab('Shared', 'person')], [search()]]),
    example: context, source: contextSource,
  },
  contrast: {
    state: { 'contrast.adaptiveTint': true, transparency: 100 },
    controls: [
      { key: 'contrast.adaptiveTint', label: 'Add tint over busy content', type: 'check' },
      { key: 'transparency', label: 'Transparency', type: 'range', min: 0, max: 100, unit: '%' },
    ],
    stage: { height: 340, backdrop: 'stories', scroll: stories },
    html: () => navHtml([basic()]),
    example: contrast, source: contrastSource,
  },
  refraction: {
    state: { transparency: 100 },
    controls: [
      { key: 'transparency', label: 'Transparency', type: 'range', min: 0, max: 100, unit: '%' },
    ],
    stage: { height: 340, backdrop: 'stories', scroll: stories.replaceAll('<article', '<article data-navbar-refract="scroll"') },
    html: () => navHtml([basic()]),
    example: refraction, source: refractionSource,
  },
  animations: {
    state: { 'animations.reflow': true, 'animations.popovers': true, 'animations.tap': true, 'animations.badges': true, width: 100 },
    controls: [
      { key: 'animations.reflow', label: 'Reflow glide', type: 'check' },
      { key: 'animations.popovers', label: 'Spring popovers', type: 'check' },
      { key: 'animations.tap', label: 'Tap feedback', type: 'check' },
      { key: 'animations.badges', label: 'Badge pop', type: 'check' },
    ],
    stage: { height: 300, width: true },
    html: () => navHtml([many(9)]),
    example: animationsExample, source: animationsSource,
    actions: [
      { label: 'Add a badge', run: (_, output) => { output.closest('.dd-card')?.querySelector('.dd-stage')?.dispatchEvent(new CustomEvent('example:badge', { detail: 1 })); } },
      { label: 'Clear it', run: (_, output) => { output.closest('.dd-card')?.querySelector('.dd-stage')?.dispatchEvent(new CustomEvent('example:badge', { detail: 0 })); } },
    ],
  },
  persistence: {
    state: {},
    stage: { height: 200, backdrop: 'aurora' },
    html: () => navHtml([many(8)]),
    example: persistence, source: persistenceSource,
    actions: [{ label: 'Reload', run: (remount, output) => { remount(); output.value = 'Mounted again with the saved tab.'; } }],
  },
};

// Every card is built now; each bar mounts as its card comes near the viewport, since dozens of glass bars at
// once would waste work.
const pending = new Map<Element, () => void>();
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const mount = pending.get(entry.target);
    if (!entry.isIntersecting || !mount) continue;
    pending.delete(entry.target);
    observer.unobserve(entry.target);
    mount();
  }
}, { rootMargin: '400px 0px' });
for (const host of document.querySelectorAll<HTMLElement>('[data-demo]')) {
  const demo = demos[host.dataset.demo ?? ''];
  if (!demo) continue;
  pending.set(host, mountDemo(host, demo, host.dataset.demo ?? ''));
  observer.observe(host);
}

// Every mention of an exported type links to its entry in the Types section, the one place they're described.
const typeRows = new Map<string, string>();
for (const row of document.querySelectorAll<HTMLElement>('#types tr[id^="type-"]')) {
  for (const code of row.querySelectorAll('td:first-child code')) typeRows.set(code.textContent ?? '', row.id);
}
const typePattern = new RegExp(`\\b(${[...typeRows.keys()].sort((a, b) => b.length - a.length).join('|')})\\b`, 'g');
for (const code of document.querySelectorAll<HTMLElement>('.dd-main code')) {
  if (code.closest('#types td:first-child, pre, a')) continue;
  const text = code.textContent ?? '';
  if (!typePattern.test(text)) continue;
  typePattern.lastIndex = 0;
  const parts: (string | HTMLAnchorElement)[] = [];
  let last = 0;
  for (const match of text.matchAll(typePattern)) {
    parts.push(text.slice(last, match.index));
    const link = document.createElement('a');
    link.href = `#${typeRows.get(match[1]!)}`;
    link.className = 'dd-type-link';
    link.textContent = match[1]!;
    parts.push(link);
    last = (match.index ?? 0) + match[0].length;
  }
  parts.push(text.slice(last));
  code.replaceChildren(...parts.filter((part) => part !== ''));
}

// The phone contents open and close smoothly.
const contentsPanel = document.querySelector<HTMLElement>('.dd-toc-panel');
document.querySelector('.dd-toc details > summary')?.addEventListener('click', (event) => {
  const details = (event.currentTarget as HTMLElement).parentElement as HTMLDetailsElement;
  if (!contentsPanel || reducedMotion() || !matchMedia('(max-width: 960px)').matches) return;
  event.preventDefault();
  if (details.open) {
    reveal(contentsPanel, false);
    setTimeout(() => { if (contentsPanel.hidden) { details.open = false; contentsPanel.hidden = false; } }, 450);
  } else {
    contentsPanel.hidden = true;
    details.open = true;
    reveal(contentsPanel, true);
  }
});

// After a jump, the section you land on briefly lights up so you can see where you are.
export function landed(id: string): void {
  const heading = document.getElementById(id)?.querySelector('h1, h2');
  if (!heading || reducedMotion()) return;
  heading.classList.remove('dd-landed');
  void (heading as HTMLElement).offsetWidth;
  heading.classList.add('dd-landed');
}
addEventListener('hashchange', () => landed(location.hash.slice(1)));

// On narrow screens the contents start collapsed so the page itself comes first.
const contents = document.querySelector<HTMLDetailsElement>('.dd-toc details');
if (contents && matchMedia('(max-width: 960px)').matches) contents.open = false;
for (const link of document.querySelectorAll('.dd-toc a')) {
  link.addEventListener('click', () => { if (contents && matchMedia('(max-width: 960px)').matches) contents.open = false; });
}

// Static code samples and the table of contents.
for (const block of document.querySelectorAll<HTMLElement>('pre[data-lang] code')) {
  const language = block.parentElement?.dataset.lang === 'html' ? 'html' : 'ts';
  block.innerHTML = highlight.highlight(block.textContent ?? '', { language }).value;
}
const links = new Map([...document.querySelectorAll<HTMLAnchorElement>('.dd-toc a')].map((link) => [link.hash.slice(1), link]));
const spy = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    for (const link of links.values()) link.removeAttribute('aria-current');
    links.get(entry.target.id)?.setAttribute('aria-current', 'true');
  }
}, { rootMargin: '-20% 0px -70% 0px' });
for (const id of links.keys()) {
  const section = document.getElementById(id);
  if (section) spy.observe(section);
}

// Hover uses the same scroll alignment as a topic link without changing the URL or keyboard focus.
let hoverReading = false;
const stopHoverScroll = () => {
  if (!hoverReading) return;
  hoverReading = false;
  scrollTo({ top: scrollY, behavior: 'instant' });
};
addEventListener('wheel', stopHoverScroll, { passive: true });
addEventListener('touchstart', stopHoverScroll, { passive: true });
addEventListener('pointerdown', stopHoverScroll, { passive: true });
addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stopHoverScroll();
});
addEventListener('hashchange', stopHoverScroll);

// During a topic jump, keep the bars on its destination as the page passes other sections.
let jumping: { target: HTMLElement; until: number } | undefined;
const siteBar = mountSiteBar('', 'docs', loadSettings(), (id, reason) => {
  const target = document.getElementById(id);
  if (!target) return;
  if (reason === 'activate') {
    stopHoverScroll();
    jumping = { target, until: performance.now() + 1500 };
    return;
  }
  jumping = undefined;
  hoverReading = true;
  siteBar.show(id);
  target.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
});
onSettingsChange((settings) => { stopHoverScroll(); siteBar.update(settings); });
const sectionIds = groups.flatMap((group) => group.sections.map(([id]) => id));
const sectionElements = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null);
let followFrame = 0;
function follow(): void {
  followFrame = 0;
  if (hoverReading) return;
  if (jumping) {
    if (Math.abs(jumping.target.getBoundingClientRect().top - 84) > 40 && performance.now() < jumping.until) return;
    jumping = undefined;
  }
  // The section whose top has passed 40% of the screen is the one being read; at the very end, the last one.
  let active = sectionElements[0];
  for (const section of sectionElements) if (section.getBoundingClientRect().top < innerHeight * .4) active = section;
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) active = sectionElements[sectionElements.length - 1];
  if (active) siteBar.show(active.id);
}
addEventListener('scroll', () => { if (!followFrame) followFrame = requestAnimationFrame(follow); }, { passive: true });
follow();

const themeToggle = document.querySelector<HTMLButtonElement>('#theme');
if (themeToggle) themeButton(themeToggle);
