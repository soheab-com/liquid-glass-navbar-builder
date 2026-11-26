try {
  const saved = localStorage.getItem('lg-navbar-docs:theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch {
  // With storage unavailable, follow the system color scheme.
}
