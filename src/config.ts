import type { EqualWidthOverflow, NavbarColors, NavbarLayout, NavbarPosition } from '@soheab-com/liquid-glass-navbar';
import { customCssLimit } from './custom-css.js';
import { isIconName, type IconName } from './icons.js';

export interface Item {
  id: string;
  label: string;
  icon: IconName | null;
  showIcon: boolean;
  showLabel: boolean;
  action: boolean;
  section: number;
  /** A manual row (1-3) for multi-row layouts; 0 lets the bar decide. */
  row: number;
  /** '' for none, 'dot', or a count. */
  badge: string;
}

export type OverflowChoice = 'none' | 'menu' | 'expand';
export type ExpandSurface = 'shared' | 'individual';

export type BackgroundKind = 'theme' | 'solid' | 'gradient';
export type Theme = 'light' | 'dark';
export type Backdrop = 'aurora' | 'photo' | 'grid' | 'plain';

export interface Config {
  position: NavbarPosition;
  theme: Theme;
  accent: string;
  /** Colour of tabs that aren't selected; null uses the theme's. */
  unselected: string | null;
  /** Icons get their own colours (below) instead of following the label. */
  iconColors: boolean;
  selectedIcon: string;
  unselectedIcon: string;
  labels: boolean;
  equalWidth: boolean;
  equalOverflow: EqualWidthOverflow;
  sectioned: boolean;
  reorderable: boolean;
  background: BackgroundKind;
  color: string;
  color2: string;
  angle: number;
  transparency: number | null;
  backdrop: Backdrop;
  customCss: string;
  layout: NavbarLayout;
  maxRows: number | null;
  overflow: OverflowChoice;
  expandSurface: ExpandSurface;
  maxVisible: number | null;
  scrollCompact: boolean;
  contrast: boolean;
  adaptiveTint: boolean;
  contextActions: boolean;
  magnify: boolean;
  items: Item[];
}

export const positions: readonly NavbarPosition[] = ['bottom', 'top', 'left', 'right'];
export const backgroundKinds: readonly BackgroundKind[] = ['theme', 'solid', 'gradient'];
export const themes: readonly Theme[] = ['light', 'dark'];
export const backdrops: readonly Backdrop[] = ['aurora', 'photo', 'grid', 'plain'];
export const equalOverflows: readonly EqualWidthOverflow[] = ['natural', 'truncate', 'grow'];
export const layouts: readonly NavbarLayout[] = ['row', 'wrap', 'rows'];
export const overflowChoices: readonly OverflowChoice[] = ['none', 'menu', 'expand'];
export const expandSurfaces: readonly ExpandSurface[] = ['shared', 'individual'];
export const maxItems = 16;

let counter = 0;
export const newId = (): string => `item-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const item = (label: string, icon: IconName | null, extra: Partial<Item> = {}): Item => ({
  id: newId(), label, icon, showIcon: icon !== null, showLabel: true, action: false, section: 0, row: 0, badge: '', ...extra,
});

export const defaultConfig = (): Config => ({
  position: 'bottom',
  theme: 'light',
  accent: '#2152a5',
  unselected: null,
  iconColors: false,
  selectedIcon: '#7048e8',
  unselectedIcon: '#868e96',
  labels: true,
  equalWidth: false,
  equalOverflow: 'natural',
  sectioned: true,
  reorderable: false,
  background: 'theme',
  color: '#f5f9ff',
  color2: '#eadcff',
  angle: 135,
  transparency: null,
  backdrop: 'photo',
  customCss: '',
  layout: 'row',
  maxRows: null,
  overflow: 'none',
  expandSurface: 'shared',
  maxVisible: null,
  scrollCompact: false,
  contrast: false,
  adaptiveTint: false,
  contextActions: false,
  magnify: false,
  items: [
    item('Home', 'home'),
    item('Schedule', 'calendar'),
    item('Map', 'map'),
    item('Search', 'search', { showLabel: false, action: true, section: 1 }),
  ],
});

const pick = <T>(options: readonly T[], value: unknown, fallback: T): T =>
  options.find((option) => option === value) ?? fallback;
const bool = (value: unknown, fallback: boolean): boolean => typeof value === 'boolean' ? value : fallback;
const hex = (value: unknown, fallback: string): string =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
const clamp = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};

function parseItem(value: unknown): Item | null {
  const raw = record(value);
  if (typeof raw.label !== 'string') return null;
  return {
    id: newId(),
    label: raw.label.slice(0, 40),
    icon: isIconName(raw.icon) ? raw.icon : null,
    showIcon: bool(raw.showIcon, true),
    showLabel: bool(raw.showLabel, true),
    action: bool(raw.action, false),
    section: clamp(raw.section, 0, 1, 0),
    row: clamp(raw.row, 0, 3, 0),
    badge: typeof raw.badge === 'string' && /^(dot|[1-9][0-9]{0,2})?$/.test(raw.badge) ? raw.badge : '',
  };
}

export function parseConfig(value: unknown): Config {
  const raw = record(value);
  const base = defaultConfig();
  const items = Array.isArray(raw.items)
    ? raw.items.map(parseItem).filter((entry): entry is Item => entry !== null).slice(0, maxItems)
    : base.items;
  return {
    position: pick(positions, raw.position, base.position),
    theme: pick(themes, raw.theme, base.theme),
    accent: hex(raw.accent, base.accent),
    unselected: raw.unselected === null || raw.unselected === undefined ? null : hex(raw.unselected, '#48566d'),
    iconColors: bool(raw.iconColors, base.iconColors),
    selectedIcon: hex(raw.selectedIcon, base.selectedIcon),
    unselectedIcon: hex(raw.unselectedIcon, base.unselectedIcon),
    labels: bool(raw.labels, base.labels),
    equalWidth: bool(raw.equalWidth, base.equalWidth),
    equalOverflow: pick(equalOverflows, raw.equalOverflow, base.equalOverflow),
    sectioned: bool(raw.sectioned, base.sectioned),
    reorderable: bool(raw.reorderable, base.reorderable),
    background: pick(backgroundKinds, raw.background, base.background),
    color: hex(raw.color, base.color),
    color2: hex(raw.color2, base.color2),
    angle: clamp(raw.angle, 0, 360, base.angle),
    transparency: raw.transparency === null ? null : clamp(raw.transparency, 0, 100, 40),
    backdrop: pick(backdrops, raw.backdrop, base.backdrop),
    customCss: typeof raw.customCss === 'string' ? raw.customCss.slice(0, customCssLimit) : '',
    layout: pick(layouts, raw.layout, base.layout),
    maxRows: raw.maxRows === null || raw.maxRows === undefined ? null : clamp(raw.maxRows, 1, 4, 2),
    overflow: pick(overflowChoices, raw.overflow, base.overflow),
    expandSurface: pick(expandSurfaces, raw.expandSurface, base.expandSurface),
    maxVisible: raw.maxVisible === null || raw.maxVisible === undefined ? null : clamp(raw.maxVisible, 1, 12, 4),
    scrollCompact: bool(raw.scrollCompact, base.scrollCompact),
    contrast: bool(raw.contrast, base.contrast),
    adaptiveTint: bool(raw.adaptiveTint, base.adaptiveTint),
    contextActions: bool(raw.contextActions, base.contextActions),
    magnify: bool(raw.magnify, base.magnify),
    items: items.length > 0 ? items : base.items,
  };
}

/** The navbar's `colors` option for the choices beyond the accent (which the CSS sets). */
export const colorsValue = (config: Config): NavbarColors => {
  const colors: NavbarColors = { selected: config.accent };
  if (config.unselected) colors.unselected = config.unselected;
  if (config.iconColors) {
    colors.selectedIcon = config.selectedIcon;
    colors.unselectedIcon = config.unselectedIcon;
  }
  return colors;
};

export const backgroundValue = (config: Config): string | undefined => {
  if (config.background === 'solid') return config.color;
  if (config.background === 'gradient') return `linear-gradient(${config.angle}deg, ${config.color}, ${config.color2})`;
  return undefined;
};

export function encodeConfig(config: Config): string {
  const { items, ...rest } = config;
  const json = JSON.stringify({ ...rest, items: items.map(({ id: _id, ...entry }) => entry) });
  return btoa(String.fromCodePoint(...new TextEncoder().encode(json))).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeConfig(encoded: string): Config | null {
  try {
    const binary = atob(encoded.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
    return parseConfig(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** The navbar's `overflow` option, or undefined when More is off. */
export const overflowValue = (config: Config): { style: 'menu' | 'expand'; surface?: ExpandSurface; maxVisible?: number } | undefined => {
  if (config.overflow === 'none') return undefined;
  return {
    style: config.overflow,
    ...(config.overflow === 'expand' && config.expandSurface !== 'shared' ? { surface: config.expandSurface } : {}),
    ...(config.maxVisible === null ? {} : { maxVisible: config.maxVisible }),
  };
};

export const badgeValue = (badge: string): { count: number } | { dot: true } | null =>
  badge === 'dot' ? { dot: true } : badge ? { count: Number(badge) } : null;
