// ============================================================
// Builder Themes (Strict TweakCN Presets from User CSS)
// 1) Modern -> Nova
// 2) Supabase -> Alpha
// 3) Caffeine -> Puma
// 4) Amethyst -> Vega
// 5) Elegant Luxury -> Zen
// 6) Bubblegum -> Bubble
// ============================================================

export interface ThemeColors {
  canvasBg: string;
  canvasText: string;
  cardBg: string;
  cardBorder: string;
  cardBorderSelected: string;
  cardRingSelected: string;
  cardText: string;
  cardMuted: string;
  cardInputBg: string;
  cardInputBorder: string;
  primary: string;
  primaryForeground: string;
  badgeBg: string;
  badgeText: string;
  previewBg: string;
  previewAccent: string;
  previewDot: string;
}

export interface FormTheme {
  id: string;
  name: string;
  preset: string;
  description: string;
  avatarSeed: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export type FormThemeResolved = Omit<FormTheme, "light" | "dark"> & {
  primary: string;
  colors: ThemeColors;
};

export const BUILDER_THEMES: FormTheme[] = [
  // 1) Modern
  {
    id: "nova",
    name: "Nova",
    preset: "Modern",
    description: "Clean blue, safe and formal for applications and registrations",
    avatarSeed: "Nova",
    light: {
      canvasBg: "oklch(1.0000 0 0)",
      canvasText: "oklch(0.3211 0 0)",
      cardBg: "oklch(1.0000 0 0)",
      cardBorder: "oklch(0.9276 0.0058 264.5313)",
      cardBorderSelected: "oklch(0.6231 0.1880 259.8145)",
      cardRingSelected: "oklch(0.6231 0.1880 259.8145)",
      cardText: "oklch(0.3211 0 0)",
      cardMuted: "oklch(0.5510 0.0234 264.3637)",
      cardInputBg: "oklch(0.9846 0.0017 247.8389)",
      cardInputBorder: "oklch(0.9276 0.0058 264.5313)",
      primary: "oklch(0.6231 0.1880 259.8145)",
      primaryForeground: "oklch(1.0000 0 0)",
      badgeBg: "oklch(0.9514 0.0250 236.8242)",
      badgeText: "oklch(0.3791 0.1378 265.5222)",
      previewBg: "oklch(0.9670 0.0029 264.5419)",
      previewAccent: "oklch(0.6231 0.1880 259.8145)",
      previewDot: "oklch(0.5461 0.2152 262.8809)",
    },
    dark: {
      canvasBg: "oklch(0.2046 0 0)",
      canvasText: "oklch(0.9219 0 0)",
      cardBg: "oklch(0.2686 0 0)",
      cardBorder: "oklch(0.3715 0 0)",
      cardBorderSelected: "oklch(0.6231 0.1880 259.8145)",
      cardRingSelected: "oklch(0.6231 0.1880 259.8145)",
      cardText: "oklch(0.9219 0 0)",
      cardMuted: "oklch(0.7155 0 0)",
      cardInputBg: "oklch(0.2393 0 0)",
      cardInputBorder: "oklch(0.3715 0 0)",
      primary: "oklch(0.6231 0.1880 259.8145)",
      primaryForeground: "oklch(1.0000 0 0)",
      badgeBg: "oklch(0.3791 0.1378 265.5222)",
      badgeText: "oklch(0.8823 0.0571 254.1284)",
      previewBg: "oklch(0.2046 0 0)",
      previewAccent: "oklch(0.6231 0.1880 259.8145)",
      previewDot: "oklch(0.7137 0.1434 254.6240)",
    },
  },
  // 2) Supabase
  {
    id: "alpha",
    name: "Alpha",
    preset: "Supabase",
    description: "Calm green accent that fits sleek, general-purpose forms",
    avatarSeed: "Alpha",
    light: {
      canvasBg: "oklch(0.9911 0 0)",
      canvasText: "oklch(0.2046 0 0)",
      cardBg: "oklch(0.9911 0 0)",
      cardBorder: "oklch(0.9037 0 0)",
      cardBorderSelected: "oklch(0.8348 0.1302 160.9080)",
      cardRingSelected: "oklch(0.8348 0.1302 160.9080)",
      cardText: "oklch(0.2046 0 0)",
      cardMuted: "oklch(0.2435 0 0)",
      cardInputBg: "oklch(0.9731 0 0)",
      cardInputBorder: "oklch(0.9037 0 0)",
      primary: "oklch(0.8348 0.1302 160.9080)",
      primaryForeground: "oklch(0.2626 0.0147 166.4589)",
      badgeBg: "oklch(0.9461 0 0)",
      badgeText: "oklch(0.2435 0 0)",
      previewBg: "oklch(0.9461 0 0)",
      previewAccent: "oklch(0.8348 0.1302 160.9080)",
      previewDot: "oklch(0.6959 0.1491 162.4796)",
    },
    dark: {
      canvasBg: "oklch(0.1822 0 0)",
      canvasText: "oklch(0.9288 0.0126 255.5078)",
      cardBg: "oklch(0.2046 0 0)",
      cardBorder: "oklch(0.2809 0 0)",
      cardBorderSelected: "oklch(0.8003 0.1821 151.7110)",
      cardRingSelected: "oklch(0.8003 0.1821 151.7110)",
      cardText: "oklch(0.9288 0.0126 255.5078)",
      cardMuted: "oklch(0.7122 0 0)",
      cardInputBg: "oklch(0.2603 0 0)",
      cardInputBorder: "oklch(0.2809 0 0)",
      primary: "oklch(0.4365 0.1044 156.7556)",
      primaryForeground: "oklch(0.9213 0.0135 167.1556)",
      badgeBg: "oklch(0.3132 0 0)",
      badgeText: "oklch(0.9851 0 0)",
      previewBg: "oklch(0.1822 0 0)",
      previewAccent: "oklch(0.8003 0.1821 151.7110)",
      previewDot: "oklch(0.7845 0.1325 181.9120)",
    },
  },
  // 3) Caffeine
  {
    id: "puma",
    name: "Puma",
    preset: "Caffeine",
    description: "Warm espresso and rich roasted tones with crisp latte cream accents",
    avatarSeed: "Puma",
    light: {
      canvasBg: "oklch(0.9821 0 0)",
      canvasText: "oklch(0.2435 0 0)",
      cardBg: "oklch(0.9911 0 0)",
      cardBorder: "oklch(0.8822 0 0)",
      cardBorderSelected: "oklch(0.4341 0.0392 41.9938)",
      cardRingSelected: "oklch(0.4341 0.0392 41.9938)",
      cardText: "oklch(0.2435 0 0)",
      cardMuted: "oklch(0.5032 0 0)",
      cardInputBg: "oklch(0.9521 0 0)",
      cardInputBorder: "oklch(0.8822 0 0)",
      primary: "oklch(0.4341 0.0392 41.9938)",
      primaryForeground: "oklch(1.0000 0 0)",
      badgeBg: "oklch(0.9310 0 0)",
      badgeText: "oklch(0.2435 0 0)",
      previewBg: "oklch(0.9521 0 0)",
      previewAccent: "oklch(0.4341 0.0392 41.9938)",
      previewDot: "oklch(0.9200 0.0651 74.3695)",
    },
    dark: {
      canvasBg: "oklch(0.1776 0 0)",
      canvasText: "oklch(0.9491 0 0)",
      cardBg: "oklch(0.2134 0 0)",
      cardBorder: "oklch(0.2351 0.0115 91.7467)",
      cardBorderSelected: "oklch(0.9247 0.0524 66.1732)",
      cardRingSelected: "oklch(0.9247 0.0524 66.1732)",
      cardText: "oklch(0.9491 0 0)",
      cardMuted: "oklch(0.7699 0 0)",
      cardInputBg: "oklch(0.2520 0 0)",
      cardInputBorder: "oklch(0.4017 0 0)",
      primary: "oklch(0.9247 0.0524 66.1732)",
      primaryForeground: "oklch(0.2029 0.0240 200.1962)",
      badgeBg: "oklch(0.2850 0 0)",
      badgeText: "oklch(0.9491 0 0)",
      previewBg: "oklch(0.1776 0 0)",
      previewAccent: "oklch(0.9247 0.0524 66.1732)",
      previewDot: "oklch(0.3163 0.0190 63.6992)",
    },
  },
  // 4) Amethyst
  {
    id: "vega",
    name: "Vega",
    preset: "Amethyst",
    description: "Distinctive purple accent giving a sophisticated, creative atmosphere",
    avatarSeed: "Vega",
    light: {
      canvasBg: "oklch(0.9777 0.0041 301.4256)",
      canvasText: "oklch(0.3651 0.0325 287.0807)",
      cardBg: "oklch(1.0000 0 0)",
      cardBorder: "oklch(0.8447 0.0226 300.1421)",
      cardBorderSelected: "oklch(0.6104 0.0767 299.7335)",
      cardRingSelected: "oklch(0.6104 0.0767 299.7335)",
      cardText: "oklch(0.3651 0.0325 287.0807)",
      cardMuted: "oklch(0.5288 0.0375 290.7895)",
      cardInputBg: "oklch(0.9329 0.0124 301.2783)",
      cardInputBorder: "oklch(0.8447 0.0226 300.1421)",
      primary: "oklch(0.6104 0.0767 299.7335)",
      primaryForeground: "oklch(0.9777 0.0041 301.4256)",
      badgeBg: "oklch(0.8957 0.0265 300.2416)",
      badgeText: "oklch(0.3651 0.0325 287.0807)",
      previewBg: "oklch(0.9777 0.0041 301.4256)",
      previewAccent: "oklch(0.6104 0.0767 299.7335)",
      previewDot: "oklch(0.7889 0.0802 359.9375)",
    },
    dark: {
      canvasBg: "oklch(0.2166 0.0215 292.8474)",
      canvasText: "oklch(0.9053 0.0245 293.5570)",
      cardBg: "oklch(0.2544 0.0301 292.7315)",
      cardBorder: "oklch(0.3063 0.0359 293.3367)",
      cardBorderSelected: "oklch(0.7058 0.0777 302.0489)",
      cardRingSelected: "oklch(0.7058 0.0777 302.0489)",
      cardText: "oklch(0.9053 0.0245 293.5570)",
      cardMuted: "oklch(0.6974 0.0282 300.0614)",
      cardInputBg: "oklch(0.2847 0.0346 291.2726)",
      cardInputBorder: "oklch(0.3063 0.0359 293.3367)",
      primary: "oklch(0.7058 0.0777 302.0489)",
      primaryForeground: "oklch(0.2166 0.0215 292.8474)",
      badgeBg: "oklch(0.3181 0.0321 308.6149)",
      badgeText: "oklch(0.8391 0.0692 2.6681)",
      previewBg: "oklch(0.2166 0.0215 292.8474)",
      previewAccent: "oklch(0.7058 0.0777 302.0489)",
      previewDot: "oklch(0.8391 0.0692 2.6681)",
    },
  },
  // 5) Elegant Luxury
  {
    id: "zen",
    name: "Zen",
    preset: "Elegant Luxury",
    description: "Sophisticated editorial palette with deep crimson and warm muted borders",
    avatarSeed: "Zen",
    light: {
      canvasBg: "oklch(0.9779 0.0042 56.3756)",
      canvasText: "oklch(0.2178 0 0)",
      cardBg: "oklch(0.9779 0.0042 56.3756)",
      cardBorder: "oklch(0.9355 0.0324 80.9937)",
      cardBorderSelected: "oklch(0.4650 0.1470 24.9381)",
      cardRingSelected: "oklch(0.4650 0.1470 24.9381)",
      cardText: "oklch(0.2178 0 0)",
      cardMuted: "oklch(0.4444 0.0096 73.6390)",
      cardInputBg: "oklch(0.9431 0.0068 53.4442)",
      cardInputBorder: "oklch(0.9355 0.0324 80.9937)",
      primary: "oklch(0.4650 0.1470 24.9381)",
      primaryForeground: "oklch(1.0000 0 0)",
      badgeBg: "oklch(0.9619 0.0580 95.6174)",
      badgeText: "oklch(0.3958 0.1331 25.7230)",
      previewBg: "oklch(0.9779 0.0042 56.3756)",
      previewAccent: "oklch(0.4650 0.1470 24.9381)",
      previewDot: "oklch(0.5054 0.1905 27.5181)",
    },
    dark: {
      canvasBg: "oklch(0.2161 0.0061 56.0434)",
      canvasText: "oklch(0.9699 0.0013 106.4238)",
      cardBg: "oklch(0.2685 0.0063 34.2976)",
      cardBorder: "oklch(0.3741 0.0087 67.5582)",
      cardBorderSelected: "oklch(0.5054 0.1905 27.5181)",
      cardRingSelected: "oklch(0.5054 0.1905 27.5181)",
      cardText: "oklch(0.9699 0.0013 106.4238)",
      cardMuted: "oklch(0.8687 0.0043 56.3660)",
      cardInputBg: "oklch(0.2291 0.0060 56.0708)",
      cardInputBorder: "oklch(0.3741 0.0087 67.5582)",
      primary: "oklch(0.5054 0.1905 27.5181)",
      primaryForeground: "oklch(0.9779 0.0042 56.3756)",
      badgeBg: "oklch(0.5553 0.1455 48.9975)",
      badgeText: "oklch(0.9619 0.0580 95.6174)",
      previewBg: "oklch(0.2161 0.0061 56.0434)",
      previewAccent: "oklch(0.5054 0.1905 27.5181)",
      previewDot: "oklch(0.7106 0.1661 22.2162)",
    },
  },
  // 6) Bubblegum
  {
    id: "bubble",
    name: "Bubble",
    preset: "Bubblegum",
    description: "Vibrant high-contrast playfulness with punchy magenta & bright cyan accents",
    avatarSeed: "Bubblegum",
    light: {
      canvasBg: "oklch(0.9399 0.0203 345.6985)",
      canvasText: "oklch(0.4712 0 0)",
      cardBg: "oklch(0.9498 0.0500 86.8891)",
      cardBorder: "oklch(0.9464 0.0327 307.1745)",
      cardBorderSelected: "oklch(0.7002 0.1597 350.7532)",
      cardRingSelected: "oklch(0.7002 0.1597 350.7532)",
      cardText: "oklch(0.4712 0 0)",
      cardMuted: "oklch(0.5795 0 0)",
      cardInputBg: "oklch(0.8800 0.0504 212.0952)",
      cardInputBorder: "oklch(0.9189 0 0)",
      primary: "oklch(0.6209 0.1801 348.1385)",
      primaryForeground: "oklch(1.0000 0 0)",
      badgeBg: "oklch(0.9195 0.0801 87.6670)",
      badgeText: "oklch(0.3211 0 0)",
      previewBg: "oklch(0.9399 0.0203 345.6985)",
      previewAccent: "oklch(0.6209 0.1801 348.1385)",
      previewDot: "oklch(0.8095 0.0694 198.1863)",
    },
    dark: {
      canvasBg: "oklch(0.2497 0.0305 234.1628)",
      canvasText: "oklch(0.9306 0.0197 349.0785)",
      cardBg: "oklch(0.2902 0.0299 233.5352)",
      cardBorder: "oklch(0.3907 0.0399 242.2181)",
      cardBorderSelected: "oklch(0.9195 0.0801 87.6670)",
      cardRingSelected: "oklch(0.6998 0.0896 201.8672)",
      cardText: "oklch(0.9306 0.0197 349.0785)",
      cardMuted: "oklch(0.7794 0.0803 4.1330)",
      cardInputBg: "oklch(0.3093 0.0305 232.0027)",
      cardInputBorder: "oklch(0.3907 0.0399 242.2181)",
      primary: "oklch(0.9195 0.0801 87.6670)",
      primaryForeground: "oklch(0.2497 0.0305 234.1628)",
      badgeBg: "oklch(0.6699 0.0988 356.9762)",
      badgeText: "oklch(0.9306 0.0197 349.0785)",
      previewBg: "oklch(0.2497 0.0305 234.1628)",
      previewAccent: "oklch(0.9195 0.0801 87.6670)",
      previewDot: "oklch(0.7794 0.0803 4.1330)",
    },
  },
];

// --------------------------------------------------------
// Resolvers
// --------------------------------------------------------

export function getFormTheme(themeId?: string, isDark: boolean = false): FormThemeResolved {
  const found = BUILDER_THEMES.find((t) => t.id === themeId);
  const theme = found ?? BUILDER_THEMES[0]; // defaults to Nova (Modern)
  const colors = isDark ? theme.dark : theme.light;
  return {
    id: theme.id,
    name: theme.name,
    preset: theme.preset,
    description: theme.description,
    avatarSeed: theme.avatarSeed,
    primary: colors.primary,
    colors,
  };
}
