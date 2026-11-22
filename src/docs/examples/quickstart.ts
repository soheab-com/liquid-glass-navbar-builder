import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example = ({ nav, output }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    onSelect(item) {
      // Show the page for this tab.
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
  });
  // #endregion
  return navbar;
};
