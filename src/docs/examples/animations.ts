import { mountLiquidGlassNavbar, type NavbarAnimations } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ animations: NavbarAnimations }> = ({ nav, stage, output, controls: { animations } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    animations,
    // Narrow the example with the width slider: items glide in and out of More.
    overflow: { style: 'menu', boundary: stage },
    onSelect(item) {
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
  });
  // Badges pop in, pulse when they change and shrink away (see the buttons under the example).
  const chats = nav.querySelector<HTMLButtonElement>('[aria-label="Chats"]')!;
  let unread = 0;
  stage.addEventListener('example:badge', (event) => {
    unread = (event as CustomEvent<number>).detail ? unread + 1 : 0;
    navbar.setBadge(chats, unread ? { count: unread, label: `${unread} unread` } : null);
  });
  // #endregion
  return navbar;
};
