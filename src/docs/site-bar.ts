import { reducedMotion, spring } from './motion.js';
import {
  mountLiquidGlassNavbar, type LiquidGlassNavbar, type LiquidGlassNavbarOptions, type NavbarItem,
} from '@soheab-com/liquid-glass-navbar';

// The docs' own navigation: a main bar of groups and a second bar with the sections of the current group.
// Both are the component itself, configured from the settings page and saved in this browser.

export interface Group {
  id: string;
  label: string;
  icon: string;
  sections: readonly (readonly [id: string, label: string])[];
}

export const groups: readonly Group[] = [
  { id: 'start', label: 'Start', icon: 'M3 10 12 3l9 7v10h-6v-6H9v6H3z', sections: [['introduction', 'Introduction'], ['install', 'Install'], ['quick-start', 'Quick start']] },
  { id: 'basics', label: 'Basics', icon: 'M5 6h14M5 12h14M5 18h9', sections: [['structure', 'Structure'], ['links', 'Links'], ['position', 'Position'], ['icons-labels', 'Icons and labels'], ['equal-width', 'Equal width'], ['look', 'Colors and glass']] },
  { id: 'interaction', label: 'Interaction', icon: 'M6 3l13 7-6 1.6L10.5 18z', sections: [['swiping', 'Swiping'], ['reordering', 'Reordering'], ['magnify', 'Magnify'], ['animations', 'Animations']] },
  { id: 'layout', label: 'Layout', icon: 'M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z', sections: [['rows', 'Rows'], ['more', 'More']] },
  { id: 'features', label: 'Features', icon: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z', sections: [['popovers', 'Popovers'], ['badges', 'Badges'], ['scroll-compact', 'Scroll compact'], ['context-actions', 'Context actions'], ['contrast', 'Contrast'], ['persistence', 'Saving the tab']] },
  { id: 'reference', label: 'Reference', icon: 'M6 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zm3 5h6m-6 4h6', sections: [['options', 'Options'], ['methods', 'Methods'], ['types', 'Types'], ['attributes', 'Attributes'], ['css', 'CSS variables'], ['accessibility', 'Accessibility'], ['browsers', 'Browsers'], ['changelog', 'Changelog']] },
];
const settingsIcon = 'M10.32 5.00L10.72 2.49L13.28 2.49L13.68 5.00L15.76 5.86L17.82 4.37L19.63 6.18L18.14 8.24L19.00 10.32L21.51 10.72L21.51 13.28L19.00 13.68L18.14 15.76L19.63 17.82L17.82 19.63L15.76 18.14L13.68 19.00L13.28 21.51L10.72 21.51L10.32 19.00L8.24 18.14L6.18 19.63L4.37 17.82L5.86 15.76L5.00 13.68L2.49 13.28L2.49 10.72L5.00 10.32L5.86 8.24L4.37 6.18L6.18 4.37L8.24 5.86Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z';

export type Position = 'bottom' | 'top' | 'left' | 'right';
export type TopicHoverMode = 'off' | 'preview' | 'keep';

export interface SiteBarSettings {
  position: Position;
  labels: boolean;
  sectionBar: boolean;
  defaultTopicHover: TopicHoverMode;
  topicHoverDelay: number;
  topicHover: Partial<Record<string, TopicHoverMode>>;
  settingsItem: boolean;
  separateSettings: boolean;
  layout: 'row' | 'wrap' | 'rows';
  maxRows: number;
  overflow: 'off' | 'menu' | 'expand';
  overflowTrigger: 'more' | 'dots';
  keepMoreOpen: boolean;
  overflowSurface: 'shared' | 'individual';
  maxVisible: number;
  equalWidth: boolean;
  equalOverflow: 'natural' | 'truncate' | 'grow';
  transparency: number | null;
  background: 'theme' | 'solid' | 'gradient';
  color: string;
  color2: string;
  accent: string | null;
  unselected: string | null;
  selectedIcon: string | null;
  unselectedIcon: string | null;
  magnify: boolean;
  magnifyScale: number;
  magnifyLift: number;
  magnifyRange: number;
  scrollCompact: boolean;
  compactThreshold: number;
  contrast: boolean;
  adaptiveTint: boolean;
  swipe: boolean;
  animations: boolean;
  reorderable: boolean;
  order: string[];
  hidden: Record<string, { icon?: boolean; label?: boolean }>;
  offset: number;
}

export const defaultSettings = (): SiteBarSettings => ({
  position: 'bottom', labels: true, sectionBar: true, defaultTopicHover: 'preview', topicHoverDelay: 2, topicHover: {}, settingsItem: true, separateSettings: true,
  layout: 'row', maxRows: 2, overflow: 'menu', overflowTrigger: 'more', keepMoreOpen: true, overflowSurface: 'shared', maxVisible: 0,
  equalWidth: false, equalOverflow: 'natural', transparency: null, background: 'theme', color: '#dce9f6', color2: '#e9dcf6',
  accent: null, unselected: null, selectedIcon: null, unselectedIcon: null,
  magnify: true, magnifyScale: 1.4, magnifyLift: 10, magnifyRange: 110,
  scrollCompact: true, compactThreshold: 16, contrast: false, adaptiveTint: false, swipe: true, animations: true,
  reorderable: false, order: groups.map((group) => group.id), hidden: {}, offset: 16,
});

const storageKey = 'lg-navbar-docs:site-bar';
const hex = (value: unknown): string | null => (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : null);

export function loadSettings(): SiteBarSettings {
  const base = defaultSettings();
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...base };
    for (const [key, fallback] of Object.entries(base)) {
      const value = raw[key];
      if (value === undefined) continue;
      if (key === 'order') {
        const ids = Array.isArray(value) ? value.filter((id): id is string => groups.some((group) => group.id === id)) : [];
        merged.order = [...new Set([...ids, ...base.order])];
      } else if (key === 'defaultTopicHover') {
        if (value === 'off' || value === 'preview' || value === 'keep') merged.defaultTopicHover = value;
      } else if (key === 'topicHoverDelay') {
        if (typeof value === 'number' && Number.isFinite(value)) merged.topicHoverDelay = Math.min(5, Math.max(0, value));
      } else if (key === 'topicHover') {
        const entries = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
        merged.topicHover = Object.fromEntries(groups.flatMap((group) => group.sections)
          .filter(([id]) => entries[id] === 'off' || entries[id] === 'preview' || entries[id] === 'keep')
          .map(([id]) => [id, entries[id]]));
      } else if (key === 'hidden') {
        merged.hidden = typeof value === 'object' && value !== null ? value : {};
      } else if (['accent', 'unselected', 'selectedIcon', 'unselectedIcon'].includes(key)) {
        merged[key] = hex(value);
      } else if (key === 'color' || key === 'color2') {
        merged[key] = hex(value) ?? fallback;
      } else if (key === 'transparency') {
        merged.transparency = typeof value === 'number' && value >= 0 && value <= 100 ? value : null;
      } else if (typeof value === typeof fallback) {
        merged[key] = value;
      }
    }
    return merged as unknown as SiteBarSettings;
  } catch {
    return base;
  }
}

export function saveSettings(settings: SiteBarSettings): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Without storage the settings last until the page is closed.
  }
}

export function onSettingsChange(listener: (settings: SiteBarSettings) => void): void {
  addEventListener('storage', (event) => { if (event.key === storageKey) listener(loadSettings()); });
}

const escape = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function itemHtml(href: string, label: string, icon: string | null, attrs = ''): string {
  const svg = icon ? `<svg data-navbar-icon viewBox="0 0 24 24" aria-hidden="true"><path d="${icon}" /></svg>` : '';
  return `<a href="${escape(href)}"${attrs}>${svg}<span data-navbar-label>${escape(label)}</span></a>`;
}

function lookOptions(settings: SiteBarSettings): LiquidGlassNavbarOptions {
  const colors: NonNullable<LiquidGlassNavbarOptions['colors']> = {};
  if (settings.accent) colors.selected = settings.accent;
  if (settings.unselected) colors.unselected = settings.unselected;
  if (settings.selectedIcon) colors.selectedIcon = settings.selectedIcon;
  if (settings.unselectedIcon) colors.unselectedIcon = settings.unselectedIcon;
  const background = settings.background === 'solid' ? settings.color
    : settings.background === 'gradient' ? `linear-gradient(135deg, ${settings.color}, ${settings.color2})` : undefined;
  return {
    position: settings.position,
    colors,
    ...(background ? { background } : {}),
    ...(settings.transparency === null ? {} : { transparency: settings.transparency }),
    ...(settings.magnify ? { magnify: { scale: settings.magnifyScale, lift: settings.magnifyLift, range: settings.magnifyRange } } : {}),
    ...(settings.contrast ? { contrast: { adaptiveTint: settings.adaptiveTint } } : {}),
    equalWidth: settings.equalWidth,
    equalWidthOverflow: settings.equalOverflow,
    animations: settings.animations,
  };
}

export interface SiteBar {
  readonly section: string;
  /** Mark the group and section being read. */
  show(section: string): void;
  update(settings: SiteBarSettings): void;
  destroy(): void;
}

/**
 * Mount the site bars. `base` is the path to the docs page (`''` on the docs page, `'../'` from settings).
 * `onJump` is called when a bar item leads to a section on this page.
 * The secondary bar reports mouse hover separately from link activation.
 */
export function mountSiteBar(base: string, page: 'docs' | 'settings', initial: SiteBarSettings, onJump?: (id: string, reason: 'activate' | 'preview' | 'keep', touch?: boolean) => void, onHoverEnd?: () => void): SiteBar {
  let settings = initial;
  let main: LiquidGlassNavbar | undefined;
  let sub: LiquidGlassNavbar | undefined;
  let mainNav: HTMLElement | undefined;
  let subNav: HTMLElement | undefined;
  let group = groups[0]!;
  // Which way the section bar slides in when the group changes: 1 from the right, -1 from the left.
  let slideFrom = 0;
  let section = '';
  let hoverRevision = 0;
  const stopWatches: (() => void)[] = [];
  const sizeWatch = new ResizeObserver(() => { placeMain(); placeSub(); measureRoom(); });

  const groupOf = (id: string): Group => groups.find((entry) => entry.sections.some(([sectionId]) => sectionId === id)) ?? groups[0]!;
  const ordered = (): Group[] => settings.order.map((id) => groups.find((entry) => entry.id === id)).filter((entry): entry is Group => entry !== undefined);

  function visibilityAttrs(id: string): string {
    const hidden = settings.hidden[id] ?? {};
    return `${hidden.icon === false ? ' data-navbar-hide-icon' : ''}${hidden.label === false ? ' data-navbar-hide-label' : ''}${hidden.icon === false || hidden.label === false ? ` aria-label="${escape(groups.find((entry) => entry.id === id)?.label ?? 'Settings')}"` : ''}`;
  }

  function buildMain(): void {
    mainNav = document.createElement('nav');
    mainNav.className = 'dd-site-bar';
    mainNav.setAttribute('aria-label', 'Docs');
    const items = ordered().map((entry) => itemHtml(`${base}#${entry.sections[0]![0]}`, entry.label, entry.icon,
      `${page === 'docs' && entry === group ? ' aria-current="page"' : ''}${settings.swipe ? '' : ' data-navbar-no-swipe'} data-group="${entry.id}"${visibilityAttrs(entry.id)}`));
    const settingsLink = settings.settingsItem
      ? itemHtml(page === 'settings' ? './' : `${base}settings/`, 'Settings', settingsIcon,
        `${page === 'settings' ? ' aria-current="page"' : ''} data-navbar-overflow="never" data-group="settings"${visibilityAttrs('settings')}`)
      : '';
    mainNav.innerHTML = settings.settingsItem && settings.separateSettings
      ? `<div data-navbar-section>${items.join('')}</div><div data-navbar-section>${settingsLink}</div>`
      : items.join('') + settingsLink;
    document.body.append(mainNav);
    main = mountLiquidGlassNavbar(mainNav, {
      ...lookOptions(settings),
      refractionSources: false,
      labels: settings.labels,
      layout: settings.layout,
      ...(settings.overflow === 'off' ? {} : {
        overflow: { style: settings.overflow, trigger: settings.overflowTrigger, surface: settings.overflowSurface, closeOnScroll: !settings.keepMoreOpen, ...(settings.maxVisible ? { maxVisible: settings.maxVisible } : {}) },
        ...(settings.layout !== 'row' ? { maxRows: settings.maxRows } : {}),
      }),
      ...(settings.scrollCompact ? { scrollCompact: { threshold: settings.compactThreshold } } : {}),
      reorderable: settings.reorderable,
      onSelect: (item) => jump(item),
      onReorder: (order) => {
        const ids = order.map((item) => item.dataset.group).filter((id): id is string => Boolean(id) && id !== 'settings');
        settings = { ...settings, order: [...ids, ...settings.order.filter((id) => !ids.includes(id))] };
        saveSettings(settings);
      },
    });
    const groupNav = mainNav;
    if (page === 'docs') bindHover(groupNav, () => mainNav === groupNav, settings.topicHoverDelay * 1000);
    placeMain();
    sizeWatch.observe(mainNav);
    // While the main bar's More is open, the section bar steps out of the way, so the two never overlap.
    const moreWatch = new MutationObserver(() => {
      const open = mainNav?.querySelector('.lg-navbar__more')?.getAttribute('aria-expanded') === 'true';
      subNav?.classList.toggle('dd-site-bar--away', open);
    });
    moreWatch.observe(mainNav, { subtree: true, attributes: true, attributeFilter: ['aria-expanded'] });
    stopWatches.push(() => moreWatch.disconnect());
  }

  function bindHover(topicNav: HTMLElement, current: () => boolean, delay = 0): void {
    let hovered: HTMLAnchorElement | undefined;
    let finger: { id: number; x: number; y: number } | undefined;
    let clientX = 0, clientY = 0;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    let leaveTimer: ReturnType<typeof setTimeout> | undefined;
    const clearHover = () => {
      clearTimeout(hoverTimer);
      clearTimeout(leaveTimer);
      hovered = undefined;
    };
    const endHover = () => {
      clearHover();
      const revision = hoverRevision;
      leaveTimer = setTimeout(() => { if (current() && revision === hoverRevision) onHoverEnd?.(); }, 110);
    };
    const track = (x: number, y: number, touch = false) => {
      if (!current()) return;
      const link = document.elementFromPoint(x, y)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const mode = link ? settings.topicHover[link.hash.slice(1)] ?? settings.defaultTopicHover : 'off';
      if (!link || !topicNav.contains(link) || mode === 'off') {
        endHover();
        return;
      }
      clientX = x;
      clientY = y;
      if (link === hovered) return;
      clearHover();
      hovered = link;
      hoverRevision++;
      const preview = () => {
        if (current() && document.elementFromPoint(clientX, clientY)?.closest('a') === link) jump(link, mode, touch);
        else if (current()) onHoverEnd?.();
      };
      if (delay === 0) preview();
      else hoverTimer = setTimeout(preview, delay);
    };
    const trackHover = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' && !event.buttons) track(event.clientX, event.clientY);
    };
    topicNav.addEventListener('pointerover', trackHover);
    topicNav.addEventListener('pointermove', trackHover);
    topicNav.addEventListener('pointerleave', (event) => { if (event.pointerType !== 'touch') endHover(); });
    topicNav.addEventListener('pointerdown', clearHover);
    topicNav.addEventListener('touchstart', (event) => {
      if (!settings.swipe || event.touches.length !== 1 || !(event.target instanceof Element)
        || !event.target.closest('a[href^="#"]')) return;
      const touch = event.touches[0]!;
      finger = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    topicNav.addEventListener('touchmove', (event) => {
      const start = finger;
      if (!start || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const dx = Math.abs(touch.clientX - start.x);
      const dy = Math.abs(touch.clientY - start.y);
      const vertical = settings.position === 'left' || settings.position === 'right';
      if (touch.identifier !== start.id || (vertical ? dy < Math.max(8, dx) : dx < Math.max(8, dy))) return;
      if (event.cancelable) event.preventDefault();
      track(touch.clientX, touch.clientY, true);
    }, { passive: false });
    const finishTouch = () => {
      if (!finger) return;
      finger = undefined;
      endHover();
    };
    topicNav.addEventListener('touchend', finishTouch);
    topicNav.addEventListener('touchcancel', finishTouch);
    topicNav.addEventListener('wheel', clearHover, { passive: true });
  }

  function buildSub(): void {
    if (!settings.sectionBar || page !== 'docs') return;
    subNav = document.createElement('nav');
    subNav.className = 'dd-site-bar dd-site-bar--sections';
    subNav.setAttribute('aria-label', `${group.label} sections`);
    subNav.innerHTML = group.sections.map(([id, label]) => itemHtml(`#${id}`, label, null,
      `${id === section ? ' aria-current="page"' : ''}${settings.swipe ? '' : ' data-navbar-no-swipe'}`)).join('');
    document.body.append(subNav);
    // Two rows before More: a group with many sections shows them all on a phone.
    sub = mountLiquidGlassNavbar(subNav, {
      ...lookOptions(settings), refractionSources: false, onSelect: (item) => jump(item),
      ...(settings.position === 'top' || settings.position === 'bottom' ? { layout: 'wrap' as const, maxRows: 2 } : {}),
      overflow: true,
    });
    const topicNav = subNav;
    bindHover(topicNav, () => subNav === topicNav, settings.topicHoverDelay * 1000);
    placeSub();
    // Its size settles after layout; measure the room again when it does.
    sizeWatch.observe(subNav);
    // Slide in from the side the reader is heading (later groups from the right).
    if (settings.animations && slideFrom) {
      const nav = subNav;
      spring(1, 0, (value) => {
        nav.style.transform = `translateX(${(slideFrom * 28 * value).toFixed(2)}px)`;
        nav.style.opacity = String(1 - Math.min(1, Math.max(0, value)));
      }, () => { nav.style.removeProperty('transform'); nav.style.removeProperty('opacity'); });
    } else if (!reducedMotion()) {
      subNav.animate({ opacity: [0, 1] }, { duration: 140, easing: 'ease-out' });
    }
    slideFrom = 0;
  }

  // At the top, the bars go below the docs header, which stays pinned there; elsewhere they sit on the edge.
  function placeMain(): void {
    if (!mainNav) return;
    const header = document.querySelector('.dd-top')?.getBoundingClientRect();
    const below = settings.position === 'top' && header ? Math.max(0, header.bottom) : 0;
    if (below) mainNav.style.setProperty('top', `${Math.round(below + settings.offset)}px`);
    else mainNav.style.removeProperty('top');
    mainNav.style.setProperty('--lg-nav-offset', `${settings.offset}px`);
  }

  // The room the bars take at the top of the page, so the content starts below them.
  function measureRoom(): void {
    if (settings.position !== 'top' || !mainNav) {
      document.documentElement.style.removeProperty('--dd-top-room');
      return;
    }
    const bottom = Math.max(mainNav.getBoundingClientRect().bottom, subNav?.getBoundingClientRect().bottom ?? 0);
    const header = document.querySelector('.dd-top')?.getBoundingClientRect().bottom ?? 0;
    document.documentElement.style.setProperty('--dd-top-room', `${Math.round(bottom - header)}px`);
  }

  // The section bar sits on the same edge, just beyond the main bar. Only its edge distance moves out; its
  // side margins stay the same as the main bar's, so it keeps the full width.
  function placeSub(): void {
    if (!subNav || !mainNav) return;
    const box = mainNav.getBoundingClientRect();
    const edge = settings.position;
    const distance = edge === 'bottom' ? innerHeight - box.top : edge === 'top' ? box.bottom : edge === 'left' ? box.right : innerWidth - box.left;
    for (const side of ['top', 'bottom', 'left', 'right'] as const) if (side !== edge) subNav.style.removeProperty(side);
    subNav.style.setProperty(edge, `${Math.round(distance + 10)}px`);
    subNav.style.setProperty('--lg-nav-offset', `${settings.offset}px`);
    sub?.sync();
    measureRoom();
  }

  function jump(item: NavbarItem, reason: 'activate' | 'preview' | 'keep' = 'activate', touch = false): void {
    if (!(item instanceof HTMLAnchorElement)) return;
    const url = new URL(item.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    onJump?.(url.hash.slice(1), reason, touch);
  }

  function build(): void {
    // The page makes room on the bars' edge (see docs.css).
    document.documentElement.dataset.siteBar = settings.position;
    buildMain();
    buildSub();
    measureRoom();
  }

  function teardown(): void {
    sizeWatch.disconnect();
    stopWatches.splice(0).forEach((stop) => stop());
    main?.destroy();
    sub?.destroy();
    mainNav?.remove();
    subNav?.remove();
    main = sub = undefined;
    mainNav = subNav = undefined;
  }

  build();
  return {
    get section() { return section; },
    show(id) {
      if (id === section) return;
      section = id;
      const next = groupOf(id);
      if (next !== group) {
        const previous = groups.indexOf(group);
        group = next;
        const item = mainNav?.querySelector<HTMLAnchorElement>(`[data-group="${group.id}"]`)
          ?? main?.overflowItems.find((entry) => entry.dataset.group === group.id);
        if (item) main?.select(item);
        const leaving = subNav;
        const leavingBar = sub;
        slideFrom = groups.indexOf(next) > previous ? 1 : -1;
        sub = undefined;
        subNav = undefined;
        // The old sections move out the other way while the new ones come in.
        if (leaving && settings.animations && !reducedMotion()) {
          leaving.style.pointerEvents = 'none';
          const away = -slideFrom;
          spring(0, 1, (value) => {
            leaving.style.transform = `translateX(${(away * 28 * value).toFixed(2)}px)`;
            leaving.style.opacity = String(1 - Math.min(1, Math.max(0, value)));
          }, () => { leavingBar?.destroy(); leaving.remove(); }, { response: .3, dampingRatio: 1 });
        } else {
          leavingBar?.destroy();
          leaving?.remove();
        }
        buildSub();
      } else if (subNav && sub) {
        const item = [...subNav.querySelectorAll<HTMLAnchorElement>('a'), ...sub.overflowItems].find((entry) => entry.getAttribute('href') === `#${id}`);
        if (item) sub.select(item);
      }
    },
    update(next) {
      settings = next;
      teardown();
      build();
    },
    destroy: teardown,
  };
}
