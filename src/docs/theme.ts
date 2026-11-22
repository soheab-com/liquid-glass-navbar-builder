// Appearance for the docs: Auto follows the system, Light and Dark are fixed. Saved in this browser.

export type Theme = 'auto' | 'light' | 'dark';
const key = 'lg-navbar-docs:theme';
const order: readonly Theme[] = ['auto', 'light', 'dark'];
const names: Record<Theme, string> = { auto: 'Auto', light: 'Light', dark: 'Dark' };
const icons: Record<Theme, string> = {
  auto: 'M12 3a9 9 0 1 0 0 18zm0 0a9 9 0 0 1 0 18',
  light: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-14v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  dark: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
};

export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(key);
    return order.find((theme) => theme === saved) ?? 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

/** Wire up a header button that switches Auto → Light → Dark. */
export function themeButton(button: HTMLButtonElement, onChange?: () => void): void {
  let theme = loadTheme();
  const render = (): void => {
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[theme]}" /></svg><span>${names[theme]}</span>`;
    button.setAttribute('aria-label', `Appearance: ${names[theme]}. Switch to ${names[order[(order.indexOf(theme) + 1) % order.length]!]}`);
  };
  button.addEventListener('click', () => {
    theme = order[(order.indexOf(theme) + 1) % order.length]!;
    try { localStorage.setItem(key, theme); } catch { /* The choice lasts until the page closes. */ }
    applyTheme(theme);
    render();
    onChange?.();
  });
  addEventListener('storage', (event) => {
    if (event.key !== key) return;
    theme = loadTheme();
    applyTheme(theme);
    render();
  });
  render();
}

applyTheme(loadTheme());
