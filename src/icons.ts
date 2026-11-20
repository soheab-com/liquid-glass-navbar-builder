export const icons = {
  home: 'M3 10 12 3l9 7v10h-6v-6H9v6H3z',
  calendar: 'M5 4h14v16H5zM5 9h14M9 2v4m6-4v4',
  map: 'M12 21s-6-6-6-11a6 6 0 1 1 12 0c0 5-6 11-6 11zm0-13v4m-2-2h4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm5-2 4 4',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4zm4 4h4',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  chat: 'M4 5h16v11H9l-5 4z',
  plus: 'M12 5v14M5 12h14',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  camera: 'M4 7h4l2-3h4l2 3h4v12H4zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-12v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1',
  cart: 'M3 4h2l2.5 11h11L21 7H6.5M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
} as const satisfies Record<string, string>;

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];
export const isIconName = (value: unknown): value is IconName =>
  typeof value === 'string' && Object.hasOwn(icons, value);
