export const customCssLimit = 8000;

export interface CleanCss {
  css: string;
  removed: number;
}

// Anything that can fetch a resource or run code. The page's CSP blocks these
// too; removing them keeps exported code free of them.
const unsafe = /url\s*\(|image-set\s*\(|image\s*\(|src\s*\(|@import|expression\s*\(|-moz-binding|behavior\s*:|\\/i;

function keep(rule: CSSRule): string | null {
  if (rule instanceof CSSStyleRule) return unsafe.test(rule.cssText) ? null : rule.cssText;
  if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule || rule instanceof CSSContainerRule) {
    const inner = [...rule.cssRules].map(keep).filter((text): text is string => text !== null);
    if (inner.length === 0) return null;
    const kind = rule instanceof CSSMediaRule ? 'media' : rule instanceof CSSSupportsRule ? 'supports' : 'container';
    const condition = `@${kind} ${rule.conditionText}`;
    return unsafe.test(condition) ? null : `${condition} {\n${inner.join('\n')}\n}`;
  }
  return null;
}

/**
 * Parses untrusted CSS with the browser's own parser and re-serialises only
 * style rules (optionally inside @media, @supports or @container), wrapped in
 * `@scope (root)`. Serialised rules always have balanced braces, so the input
 * can't close the scope and style the rest of the page.
 */
export function cleanCss(input: string, root: string): CleanCss {
  if (input.trim() === '') return { css: '', removed: 0 };
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(input.slice(0, customCssLimit));
  const rules = [...sheet.cssRules];
  const kept = rules.map(keep).filter((text): text is string => text !== null);
  const removed = rules.length - kept.length;
  if (kept.length === 0) return { css: '', removed };
  return { css: `@scope (${root}) {\n${kept.join('\n')}\n}`, removed };
}
