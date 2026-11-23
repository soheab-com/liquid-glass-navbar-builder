import { mountLiquidGlassNavbar, type NavbarLayout, type NavbarOverflowOptions } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ layout: NavbarLayout; maxRows: number; overflow: NavbarOverflowOptions }> = ({ nav, stage, output, controls: { layout, maxRows, overflow } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    layout,
    maxRows,
    // Keep the popover inside the example.
    overflow: { ...overflow, boundary: stage },
    onSelect(item) {
      output.value = `Selected ${item.getAttribute('aria-label')}`;
    },
    onOverflowChange(items) {
      output.value = `Behind More: ${items.map((item) => item.getAttribute('aria-label')).join(', ') || 'nothing'}`;
    },
  });
  // #endregion
  return navbar;
};
