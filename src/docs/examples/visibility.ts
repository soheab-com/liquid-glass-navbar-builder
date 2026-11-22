import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ icon: boolean; label: boolean }> = ({ nav, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {});
  const map = nav.querySelector<HTMLButtonElement>('[aria-label="Map"]')!;
  navbar.setItemVisibility(map, { icon: controls.icon, label: controls.label });
  // #endregion
  return navbar;
};
