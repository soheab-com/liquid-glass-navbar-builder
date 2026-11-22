import { mountLiquidGlassNavbar, type NavbarLayout } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

interface Controls {
  style: 'menu' | 'expand';
  surface: 'shared' | 'individual';
  layout: NavbarLayout;
  maxRows: number;
  maxVisible: number;
}

export const run: Example<Controls> = ({ nav, stage, output, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    layout: controls.layout,
    maxRows: controls.maxRows,
    overflow: {
      style: controls.style,
      surface: controls.surface,
      // 0 means: as many as fit.
      ...(controls.maxVisible ? { maxVisible: controls.maxVisible } : {}),
      // Keep the popover inside the example.
      boundary: stage,
    },
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
