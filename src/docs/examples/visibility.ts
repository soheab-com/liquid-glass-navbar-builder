import { mountLiquidGlassNavbar, type ItemVisibility } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ visibility: ItemVisibility }> = ({ nav, controls: { visibility } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {});
  const map = nav.querySelector<HTMLButtonElement>('[aria-label="Map"]')!;
  navbar.setItemVisibility(map, visibility);
  // #endregion
  return navbar;
};
