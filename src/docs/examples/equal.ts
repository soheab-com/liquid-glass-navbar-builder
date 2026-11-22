import { mountLiquidGlassNavbar, type EqualWidthOverflow } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ equal: boolean; overflow: EqualWidthOverflow }> = ({ nav, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    equalWidth: controls.equal,
    equalWidthOverflow: controls.overflow,
  });
  // #endregion
  return navbar;
};
