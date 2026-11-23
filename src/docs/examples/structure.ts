import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ labels: boolean }> = ({ nav, output, controls: { labels } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    labels,
    onSelect(item) {
      output.value = `Tab: ${item.getAttribute('aria-label')}`;
    },
    onAction(item) {
      output.value = `Action: ${item.getAttribute('aria-label')}`;
    },
  });
  // #endregion
  return navbar;
};
