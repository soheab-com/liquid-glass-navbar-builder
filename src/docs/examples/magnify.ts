import { mountLiquidGlassNavbar, type NavbarMagnifyOptions, type NavbarPosition } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ position: NavbarPosition; magnify: NavbarMagnifyOptions }> = ({ nav, controls: { position, magnify } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    position,
    magnify,
  });
  // #endregion
  return navbar;
};
