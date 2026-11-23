import { mountLiquidGlassNavbar, type PopoverPlacement } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ placement: PopoverPlacement }> = ({ nav, stage, output, controls: { placement } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {});
  const entries = ['New note', 'New checklist', 'New folder'].map((label) => {
    const entry = document.createElement('button');
    entry.type = 'button';
    entry.className = 'menu-entry';
    entry.textContent = label;
    entry.addEventListener('click', () => { output.value = `${label} pressed`; });
    return entry;
  });
  const create = nav.querySelector<HTMLButtonElement>('#create')!;
  navbar.createPopover(create, entries, { label: 'Create', placement, boundary: stage });
  // #endregion
  return navbar;
};
