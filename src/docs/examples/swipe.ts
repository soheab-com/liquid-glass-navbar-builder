import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ optOut: boolean }> = ({ nav, output, controls: { optOut } }) => {
  // #region
  // The Search section opts out of swipes with data-navbar-no-swipe (see the HTML).
  nav.querySelector('[data-navbar-section]:last-child')?.toggleAttribute('data-navbar-no-swipe', optOut);
  const navbar = mountLiquidGlassNavbar(nav, {
    onSelect(item) {
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
    onAction(item) {
      output.value = `${item.getAttribute('aria-label')} pressed`;
    },
  });
  // #endregion
  return navbar;
};
