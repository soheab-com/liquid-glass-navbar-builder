import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

interface Controls {
  theme: 'light' | 'dark';
  accent: string;
  unselected: string;
  background: 'theme' | 'solid' | 'gradient';
  transparency: number;
}

export const run: Example<Controls> = ({ nav, controls }) => {
  // #region
  const backgrounds = { theme: undefined, solid: '#c9dcf5', gradient: 'linear-gradient(135deg, #aacaef, #e3b9ed)' };
  const background = backgrounds[controls.background];
  if (controls.theme === 'dark') {
    // The dark glass is a set of CSS variables on the nav.
    nav.style.setProperty('--lg-nav-surface', '#293b5fbd');
    nav.style.setProperty('--lg-nav-opaque', '#293b5f');
    nav.style.setProperty('--lg-nav-rim', '#a8c0ef66');
    nav.style.setProperty('--lg-nav-highlight', '#e8f0ff50');
    nav.style.setProperty('--lg-nav-shadow', '#040b1a88');
  }
  const navbar = mountLiquidGlassNavbar(nav, {
    colors: { selected: controls.accent, unselected: controls.unselected },
    transparency: controls.transparency,
    ...(background ? { background } : {}),
  });
  // #endregion
  return navbar;
};
