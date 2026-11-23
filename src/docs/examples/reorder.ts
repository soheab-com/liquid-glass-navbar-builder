import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ editing: boolean }> = ({ nav, output, controls: { editing } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    reorderable: true,
    onReorder(order) {
      // Save the new order.
      output.value = `New order: ${order.map((item) => item.getAttribute('aria-label')).join(', ')}`;
    },
  });
  // Drag to reorder while editing; Alt and the arrow keys always work.
  navbar.setReorderMode(editing);
  // #endregion
  return navbar;
};
