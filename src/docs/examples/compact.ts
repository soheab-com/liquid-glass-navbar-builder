import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ threshold: number }> = ({ nav, stage, output, controls: { threshold } }) => {
  // #region
  const feed = stage.querySelector<HTMLElement>('.feed')!;
  const navbar = mountLiquidGlassNavbar(nav, {
    scrollCompact: { source: feed, threshold },
    onCompactChange(compact) {
      output.value = compact ? 'Compact' : 'Labels back';
    },
  });
  // #endregion
  return navbar;
};
