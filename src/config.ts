import type { EqualWidthOverflow, NavbarColors, NavbarPosition } from '@soheab-com/liquid-glass-navbar';
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
}

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
  items: Item[];
}

export const positions: readonly NavbarPosition[] = ['bottom', 'top', 'left', 'right'];
export const backgroundKinds: readonly BackgroundKind[] = ['theme', 'solid', 'gradient'];
export const themes: readonly Theme[] = ['light', 'dark'];
export const backdrops: readonly Backdrop[] = ['aurora', 'photo', 'grid', 'plain'];
export const equalOverflows: readonly EqualWidthOverflow[] = ['natural', 'truncate', 'grow'];

let counter = 0;
export const newId = (): string => `item-${Date.now().toString(36)}-${(counter++).toString(36)}`;

const item = (label: string, icon: IconName | null, extra: Partial<Item> = {}): Item => ({
  id: newId(), label, icon, showIcon: icon !== null, showLabel: true, action: false, section: 0, ...extra,
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
  backdrop: 'aurora',
  customCss: '',
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
  };
}

export function parseConfig(value: unknown): Config {
  const raw = record(value);
  const base = defaultConfig();
  const items = Array.isArray(raw.items)
    ? raw.items.map(parseItem).filter((entry): entry is Item => entry !== null).slice(0, 12)
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
    items: items.length > 0 ? items : base.items,
  };
}

/** The navbar's `colors` option for the choices beyond the accent (which the CSS sets). */
export const colorsValue = (config: Config): NavbarColors | undefined => {
  const colors: NavbarColors = {};
  if (config.unselected) colors.unselected = config.unselected;
  if (config.iconColors) {
    colors.selectedIcon = config.selectedIcon;
    colors.unselectedIcon = config.unselectedIcon;
  }
  return Object.keys(colors).length > 0 ? colors : undefined;
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
