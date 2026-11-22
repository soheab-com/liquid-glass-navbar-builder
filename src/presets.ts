import { defaultConfig, type Config } from './config.js';

const presets = new Map<string, Partial<Config>>([
  ['clear', { transparency: 100 }],
  ['tinted', { theme: 'dark', accent: '#a5cbff', transparency: 28, backdrop: 'aurora' }],
  ['dock', { sectioned: false, labels: false, equalWidth: true, transparency: 72 }],
  ['sidebar', { position: 'left', sectioned: false, equalWidth: true, equalOverflow: 'truncate', transparency: 54 }],
]);

export function loadPreset(id: string): Config | undefined {
  const preset = presets.get(id);
  if (preset) return { ...defaultConfig(), ...preset };
}
