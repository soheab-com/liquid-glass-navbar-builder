# Liquid Glass navbar builder

A page for designing a [Liquid Glass navbar](https://github.com/soheab-com/liquid-glass-navbar) and copying the HTML, TypeScript and CSS for it. The preview runs the real component in a phone, tablet or desktop frame.

Options: position, labels, separate sections, reordering, theme, accent, background (theme, solid or gradient), transparency, preview backdrop, and per item the label, icon, icon and label visibility, action and section. The configuration lives in the URL, so a copied link opens the same navbar.

```sh
npm install
npm run check
npm run build   # writes dist/, swapped in at the end
```

`dist/` is a static site: serve `index.html` without caching and `assets/` (content-hashed) with long caching.

## Custom CSS

Custom CSS can arrive through a shared link, so it is treated as untrusted. The browser parses it, only style rules (also inside `@media`, `@supports` and `@container`) are kept, and rules containing `url()`, `@import` or CSS escapes are dropped. What remains is re-serialised inside `@scope` for the navbar, so it cannot close the scope and style the rest of the page. Serve the page with a Content Security Policy that blocks other origins, for example:

```
default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

## Navbar package

The builder uses the navbar from a checkout at `../liquid-glass-navbar` (see `package.json`).

## Disclaimer

Not affiliated with or endorsed by Apple Inc. Apple and iOS are trademarks of Apple Inc. Liquid Glass is the name Apple uses for its design style. This is an independent take on the look.
