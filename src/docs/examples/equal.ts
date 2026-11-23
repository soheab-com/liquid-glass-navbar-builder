import { mountLiquidGlassNavbar, type EqualWidthOverflow } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ equalWidth: boolean; equalWidthOverflow: EqualWidthOverflow }> = ({ nav, controls: { equalWidth, equalWidthOverflow } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    equalWidth,
    equalWidthOverflow,
  });
  // #endregion
  return navbar;
};
