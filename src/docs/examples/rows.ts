import { mountLiquidGlassNavbar, type NavbarLayout } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ layout: NavbarLayout }> = ({ nav, output, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    layout: controls.layout,
    onSelect(item) {
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
  });
  // #endregion
  return navbar;
};
