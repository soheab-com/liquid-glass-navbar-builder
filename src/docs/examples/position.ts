import { mountLiquidGlassNavbar, type NavbarPosition } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ position: NavbarPosition | '' }> = ({ nav, output, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    ...(controls.position ? { position: controls.position } : {}),
    onSelect(item) {
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
  });
  // Move it later without mounting again:
  // navbar.setPosition('top');
  // #endregion
  return navbar;
};
