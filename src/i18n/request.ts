import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate locale
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    messages: {
      ...(await import(`./messages/${locale}/common.json`)).default,
      ...(await import(`./messages/${locale}/marketing.json`)).default,
      ...(await import(`./messages/${locale}/dashboard.json`)).default,
      ...(await import(`./messages/${locale}/editor.json`)).default,
      ...(await import(`./messages/${locale}/site.json`)).default,
    },
  };
});
