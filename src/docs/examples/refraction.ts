import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ transparency: number }> = ({ nav, stage, controls: { transparency } }) => {
  // #region
  // Chromium bends the live page behind the glass. Safari can't, so it bends a copy of the
  // elements you mark: data-navbar-refract for fixed backdrops, data-navbar-refract="scroll"
  // for content that scrolls under the bar (its copy follows scrolling from script).
  const navbar = mountLiquidGlassNavbar(nav, {
    transparency,
    // The example's content is marked inside it, so look for it there.
    refractionSources: () => stage.querySelectorAll('[data-navbar-refract]'),
  });
  // #endregion
  return navbar;
};
