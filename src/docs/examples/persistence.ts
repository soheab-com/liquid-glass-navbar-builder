import { mountLiquidGlassNavbar, type NavbarItem } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example = ({ nav, output }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    overflow: true,
    onSelect(item) {
      localStorage.setItem('saved-tab', item.getAttribute('aria-label') ?? '');
      output.value = `Saved ${item.getAttribute('aria-label')}. Press Reload to mount the bar again.`;
    },
  });
  // Restore the saved tab, even when it's behind More.
  const saved = localStorage.getItem('saved-tab');
  const items: NavbarItem[] = [...nav.querySelectorAll<NavbarItem>('button[aria-label]'), ...navbar.overflowItems];
  const tab = items.find((item) => item.getAttribute('aria-label') === saved);
  if (tab) navbar.select(tab);
  // #endregion
  return navbar;
};
