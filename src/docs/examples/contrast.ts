import { mountLiquidGlassNavbar, type ContrastOptions } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ transparency: number; contrast: ContrastOptions }> = ({ nav, stage, output, controls: { transparency, contrast } }) => {
  // #region
  // Content behind the bar is marked with data-navbar-backdrop="dark", "light" and/or "busy".
  const navbar = mountLiquidGlassNavbar(nav, {
    transparency,
    // The example's content is marked inside it, so look for regions there.
    contrast: { ...contrast, regions: () => stage.querySelectorAll('[data-navbar-backdrop]') },
  });
  // Show what the bar sees behind it.
  stage.querySelector('.feed')?.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      output.value = `Behind the bar: ${nav.dataset.lgNavbarBackdrop ?? 'light'}${nav.classList.contains('lg-navbar--busy') ? ', busy' : ''}`;
    });
  }, { passive: true });
  // #endregion
  return navbar;
};
