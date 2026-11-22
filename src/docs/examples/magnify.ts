import { mountLiquidGlassNavbar, type NavbarPosition } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ scale: number; lift: number; range: number; position: NavbarPosition }> = ({ nav, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    position: controls.position,
    magnify: { scale: controls.scale, lift: controls.lift, range: controls.range },
  });
  // #endregion
  return navbar;
};
