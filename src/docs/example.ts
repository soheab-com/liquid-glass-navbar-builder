import type { LiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';

/** What a docs example receives. The code shown on the page is the example's own source. */
export interface ExampleContext<Controls> {
  /** The example's `<nav>`. */
  nav: HTMLElement;
  /** The example's area, for boundaries and scrolling content. */
  stage: HTMLElement;
  /** The line under the example that shows what happened. */
  output: HTMLOutputElement;
  /** The current values of the controls under the example. */
  controls: Controls;
}

export type Example<Controls = Record<string, never>> = (context: ExampleContext<Controls>) => LiquidGlassNavbar;
