import type { EqualWidthOverflow, NavbarColors, NavbarLayout, NavbarPosition, NavbarLensOptions, NavbarLensStyle, NavbarOverflowOptions } from '@soheab-com/liquid-glass-navbar';
import { customCssLimit } from './custom-css.js';
import { isIconName, type IconName } from './icons.js';

export interface Item {
  id: string;
  label: string;
  icon: IconName | null;
  showIcon: boolean;
  showLabel: boolean;
  action: boolean;
  hidden?: boolean;
  pin?: boolean;
  noHover?: boolean;
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
  overflowTrigger: 'more' | 'dots';
  maxVisible: number | null;
  desktopMaxVisible: number | null;
  sectionMaxVisible: number | null;
  sectionEqual: boolean;
  moreLabel: boolean;
  closeOnScroll: boolean;
  collapsible: boolean;
  startCollapsed: boolean;
  lensStyle: NavbarLensStyle;
  lensAccent: string | null;
  lensBackground: string | null;
  lensRadius: number | null;
  lensBlur: number;
  lensPressScale: number | null;
  lensDragScale: number | null;
  hoverGroup: boolean;
  scrollCompact: boolean;
  contrast: boolean;
  adaptiveTint: boolean;
  contextActions: boolean;
  hover: 'off' | 'preview' | 'keep';
  hoverDelay: number;
  magnify: boolean;
  animations: boolean;
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
  overflowTrigger: 'more',
  maxVisible: null,
  desktopMaxVisible: null,
  sectionMaxVisible: null,
  sectionEqual: false,
  moreLabel: true,
  closeOnScroll: false,
  collapsible: false,
  startCollapsed: false,
  lensStyle: 'glass',
  lensAccent: null,
  lensBackground: null,
  lensRadius: null,
  lensBlur: 1.5,
  lensPressScale: null,
  lensDragScale: null,
  hoverGroup: false,
  scrollCompact: false,
  contrast: false,
  adaptiveTint: false,
  contextActions: false,
  hover: 'off',
  hoverDelay: 0,
  magnify: false,
  animations: false,
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
const decimal = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
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
    hidden: bool(raw.hidden, false),
    pin: bool(raw.pin, false),
    noHover: bool(raw.noHover, false),
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
    overflowTrigger: raw.overflowTrigger === 'dots' ? 'dots' : 'more',
    maxVisible: raw.maxVisible === null || raw.maxVisible === undefined ? null : clamp(raw.maxVisible, 1, 12, 4),
    desktopMaxVisible: typeof raw.desktopMaxVisible === 'number' ? clamp(raw.desktopMaxVisible, 1, 16, 8) : null,
    sectionMaxVisible: typeof raw.sectionMaxVisible === 'number' ? clamp(raw.sectionMaxVisible, 1, 16, 4) : null,
    sectionEqual: bool(raw.sectionEqual, base.sectionEqual),
    moreLabel: bool(raw.moreLabel, base.moreLabel),
    closeOnScroll: bool(raw.closeOnScroll, base.closeOnScroll),
    collapsible: bool(raw.collapsible, base.collapsible),
    startCollapsed: bool(raw.startCollapsed, base.startCollapsed),
    lensStyle: pick(['glass', 'tinted', 'outline'] as const, raw.lensStyle, base.lensStyle),
    lensBackground: typeof raw.lensBackground === 'string' ? hex(raw.lensBackground, '#ffffff') : null,
    lensRadius: typeof raw.lensRadius === 'number' ? clamp(raw.lensRadius, 0, 999, 24) : null,
    lensAccent: typeof raw.lensAccent === 'string' ? hex(raw.lensAccent, '#2152a5') : null,
    lensBlur: decimal(raw.lensBlur, 0, 12, base.lensBlur),
    lensPressScale: typeof raw.lensPressScale === 'number' ? decimal(raw.lensPressScale, .5, 2, 1.08) : null,
    lensDragScale: typeof raw.lensDragScale === 'number' ? decimal(raw.lensDragScale, .5, 2, 1.22) : null,
    hoverGroup: bool(raw.hoverGroup, base.hoverGroup),
    scrollCompact: bool(raw.scrollCompact, base.scrollCompact),
    contrast: bool(raw.contrast, base.contrast),
    adaptiveTint: bool(raw.adaptiveTint, base.adaptiveTint),
    contextActions: bool(raw.contextActions, base.contextActions),
    hover: pick(['off', 'preview', 'keep'] as const, raw.hover, base.hover),
    hoverDelay: clamp(raw.hoverDelay, 0, 5000, base.hoverDelay),
    magnify: bool(raw.magnify, base.magnify),
    animations: bool(raw.animations, base.animations),
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
export const overflowValue = (config: Config): NavbarOverflowOptions | undefined => {
  if (config.overflow === 'none') return undefined;
  return {
    style: config.overflow,
    ...(config.overflowTrigger === 'dots' ? { trigger: 'dots' as const } : {}),
    ...(config.overflow === 'expand' && config.expandSurface !== 'shared' ? { surface: config.expandSurface } : {}),
    ...(config.desktopMaxVisible !== null
      ? { maxVisible: { ...(config.maxVisible === null ? {} : { 0: config.maxVisible }), 900: config.desktopMaxVisible } }
      : config.maxVisible === null ? {} : { maxVisible: config.maxVisible }),
    ...(config.moreLabel ? {} : { moreLabel: false }),
    ...(config.closeOnScroll ? { closeOnScroll: true } : {}),
  };
};

export const lensValue = (config: Config): NavbarLensOptions => ({
  ...(config.lensStyle === 'glass' ? {} : { style: config.lensStyle }),
  ...(config.lensAccent === null ? {} : { accent: config.lensAccent }),
  ...(config.lensBackground === null ? {} : { background: config.lensBackground }),
  ...(config.lensRadius === null ? {} : { radius: `${config.lensRadius}px` }),
  ...(config.lensBlur === 1.5 ? {} : { blur: config.lensBlur }),
  ...(config.lensPressScale === null ? {} : { pressScale: config.lensPressScale }),
  ...(config.lensDragScale === null ? {} : { dragScale: config.lensDragScale }),
});

export const canCollapse = (config: Config): boolean =>
  config.collapsible && config.layout === 'rows' && (config.position === 'top' || config.position === 'bottom');

export const badgeValue = (badge: string): { count: number } | { dot: true } | null =>
  badge === 'dot' ? { dot: true } : badge ? { count: Number(badge) } : null;
