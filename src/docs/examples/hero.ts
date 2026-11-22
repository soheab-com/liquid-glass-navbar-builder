import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example = ({ nav, output }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    magnify: true,
    transparency: 55,
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
