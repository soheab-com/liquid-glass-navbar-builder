import { createSpring } from '@soheab-com/liquid-glass-navbar';

// The docs move with the navbar's own springs. Nothing here runs with Reduce Motion.

export const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Spring a value from `from` to `to`, calling `apply` each frame; `done` runs once it settles. */
export function spring(from: number, to: number, apply: (value: number) => void, done?: () => void,
  { response = .4, dampingRatio = .86 }: { response?: number; dampingRatio?: number } = {}): void {
  if (reducedMotion()) {
    apply(to);
    done?.();
    return;
  }
  const motion = createSpring(from, apply, { response, dampingRatio, precision: .002, onRest: () => done?.() });
  motion.set(from);
  motion.to(to);
}

/** Slide an element in from the side (`direction` -1 or 1) while it fades up. */
export function slideIn(element: HTMLElement, direction: number, distance = 22): void {
  spring(1, 0, (value) => {
    element.style.translate = `${(direction * distance * value).toFixed(2)}px 0`;
    element.style.opacity = String(1 - Math.min(1, Math.max(0, value)));
  }, () => {
    element.style.removeProperty('translate');
    element.style.removeProperty('opacity');
  });
}

/** Show or hide an element by easing its height and opacity; it ends `hidden` when hidden. */
export function reveal(element: HTMLElement, show: boolean): void {
  if (show === !element.hidden && !element.dataset.revealing) return;
  if (reducedMotion()) {
    element.hidden = !show;
    return;
  }
  element.hidden = false;
  const full = element.scrollHeight;
  element.dataset.revealing = show ? 'in' : 'out';
  element.style.overflow = 'hidden';
  spring(show ? 0 : 1, show ? 1 : 0, (value) => {
    const amount = Math.min(1, Math.max(0, value));
    element.style.height = `${(full * amount).toFixed(1)}px`;
    element.style.opacity = String(amount);
  }, () => {
    if (element.dataset.revealing !== (show ? 'in' : 'out')) return;
    delete element.dataset.revealing;
    for (const property of ['height', 'opacity', 'overflow']) element.style.removeProperty(property);
    element.hidden = !show;
  }, { response: .34, dampingRatio: 1 });
}

/** Glide elements from where they were (`before`, by key) to where they are now. */
export function glideFrom(before: Map<string, DOMRect>, now: Iterable<[string, HTMLElement]>): void {
  if (reducedMotion()) return;
  for (const [key, element] of now) {
    const old = before.get(key);
    if (!old) continue;
    const rect = element.getBoundingClientRect();
    const dx = old.left - rect.left;
    const dy = old.top - rect.top;
    if (Math.abs(dx) < .5 && Math.abs(dy) < .5) continue;
    spring(1, 0, (value) => {
      element.style.translate = `${(dx * value).toFixed(2)}px ${(dy * value).toFixed(2)}px`;
    }, () => element.style.removeProperty('translate'));
  }
}
