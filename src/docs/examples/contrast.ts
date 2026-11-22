import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ adaptive: boolean; transparency: number }> = ({ nav, stage, output, controls }) => {
  // #region
  // Content behind the bar is marked with data-navbar-backdrop="dark", "light" and/or "busy".
  const navbar = mountLiquidGlassNavbar(nav, {
    transparency: controls.transparency,
    contrast: {
      regions: () => stage.querySelectorAll('[data-navbar-backdrop]'),
      adaptiveTint: controls.adaptive,
    },
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
