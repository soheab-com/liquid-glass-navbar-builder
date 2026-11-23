import { mountLiquidGlassNavbar, type NavbarContextPlacement } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

// 'section' stands for the bar's first section, which the example passes as the placement.
export const run: Example<{ placement: Exclude<NavbarContextPlacement, HTMLElement> | 'section'; back: boolean; ownLook: boolean }> = ({ nav, stage, output, controls: { placement, back, ownLook } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {
    onAction(item) {
      if (item.dataset.action === 'done') return clearSelection();
      output.value = `${item.getAttribute('aria-label')} ${selected().length} files`;
    },
  });
  const files = [...stage.querySelectorAll<HTMLButtonElement>('.files button')];
  const selected = () => files.filter((file) => file.getAttribute('aria-pressed') === 'true');

  function action(label: string, name: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.action = name;
    button.setAttribute('data-navbar-action', '');
    button.setAttribute('aria-label', label);
    const text = document.createElement('span');
    text.setAttribute('data-navbar-label', '');
    text.textContent = label;
    button.append(text);
    return button;
  }

  function showActions(): void {
    const actions = [action('Share', 'share'), action('Move', 'move')];
    if (!back) actions.push(action('Done', 'done'));
    navbar.showContextActions(actions, {
      label: `Actions for ${selected().length} files`,
      // 'section' replaces just the first section of the bar.
      placement: placement === 'section' ? nav.querySelector<HTMLElement>('[data-navbar-section]')! : placement,
      back,
      onBack: clearSelection,
      ...(ownLook ? { look: { colors: { selected: '#ffffff', unselected: '#ffffff' }, background: '#2763a6', transparency: 15 } } : {}),
    });
  }

  function clearSelection(): void {
    for (const file of files) file.setAttribute('aria-pressed', 'false');
    navbar.hideContextActions(); // the previous items and tab come back
    output.value = 'Selection cleared';
  }

  for (const file of files) {
    file.addEventListener('click', () => {
      file.setAttribute('aria-pressed', String(file.getAttribute('aria-pressed') !== 'true'));
      if (selected().length) showActions();
      else navbar.hideContextActions();
    });
  }
  // #endregion
  return navbar;
};
