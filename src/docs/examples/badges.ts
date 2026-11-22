import { mountLiquidGlassNavbar } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

interface Controls {
  chats: number;
  dot: boolean;
  status: '' | 'info' | 'success' | 'warning' | 'error';
}

export const run: Example<Controls> = ({ nav, controls }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {});
  const item = (label: string) => nav.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  navbar.setBadge(item('Chats'), controls.chats ? { count: controls.chats, label: `${controls.chats} unread` } : null);
  navbar.setBadge(item('Alerts'), controls.dot ? { dot: true, label: 'New alerts' } : null);
  navbar.setBadge(item('Sync'), controls.status ? { status: controls.status, label: `Sync ${controls.status}` } : null);
  // #endregion
  return navbar;
};
