import { mountLiquidGlassNavbar, type NavbarColors } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ theme: 'light' | 'dark'; tint: 'theme' | 'solid' | 'gradient'; colors: NavbarColors; transparency: number }> = ({ nav, controls: { theme, tint, colors, transparency } }) => {
  // #region
  const backgrounds = { theme: undefined, solid: '#c9dcf5', gradient: 'linear-gradient(135deg, #aacaef, #e3b9ed)' };
  const background = backgrounds[tint];
  // Each theme's glass is a set of CSS variables on the nav; the light glass is the default.
  const glass: Record<'light' | 'dark', Record<string, string>> = {
    light: {},
    dark: {
      '--lg-nav-surface': '#293b5fbd',
      '--lg-nav-opaque': '#293b5f',
      '--lg-nav-rim': '#a8c0ef66',
      '--lg-nav-highlight': '#e8f0ff50',
      '--lg-nav-shadow': '#040b1a88',
    },
  };
  for (const [name, value] of Object.entries(glass[theme])) nav.style.setProperty(name, value);
  const navbar = mountLiquidGlassNavbar(nav, {
    colors,
    transparency,
    ...(background ? { background } : {}),
  });
  // #endregion
  return navbar;
};
