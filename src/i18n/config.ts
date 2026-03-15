export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

// Pathnames traducidos para SEO de marketing pages
export const pathnames = {
  '/': '/',
  '/pricing': {
    es: '/precios',
    en: '/pricing',
  },
  '/case-studies': {
    es: '/casos-de-estudio',
    en: '/case-studies',
  },
  '/resources': {
    es: '/recursos',
    en: '/resources',
  },
  '/about': {
    es: '/nosotros',
    en: '/about',
  },
  '/contact': {
    es: '/contacto',
    en: '/contact',
  },
  '/integrations': {
    es: '/integraciones',
    en: '/integrations',
  },
  '/roadmap': {
    es: '/roadmap',
    en: '/roadmap',
  },
} as const;

export type Pathnames = typeof pathnames;
