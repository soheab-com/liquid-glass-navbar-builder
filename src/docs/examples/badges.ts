import { mountLiquidGlassNavbar, type NavbarBadgeStatus } from '@soheab-com/liquid-glass-navbar';
import type { Example } from '../example.js';

export const run: Example<{ chats: number; dot: boolean; status: NavbarBadgeStatus | '' }> = ({ nav, controls: { chats, dot, status } }) => {
  // #region
  const navbar = mountLiquidGlassNavbar(nav, {});
  const item = (label: string) => nav.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
  navbar.setBadge(item('Chats'), chats ? { count: chats, label: `${chats} unread` } : null);
  navbar.setBadge(item('Alerts'), dot ? { dot: true, label: 'New alerts' } : null);
  navbar.setBadge(item('Sync'), status ? { status, label: `Sync ${status}` } : null);
  // #endregion
  return navbar;
};
