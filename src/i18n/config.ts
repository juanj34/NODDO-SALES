export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

// CRITICAL: Always prefix URLs with locale
export const localePrefix = 'always' as const;

// Pathnames para todas las rutas (marketing, dashboard, microsites)
export const pathnames = {
  // ── Marketing pages (traducidas) ──
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
  '/roadmap': '/roadmap',
  '/faq': '/faq',
  '/login': '/login',
  '/signup': '/signup',
  '/recuperar': '/recuperar',
  '/nueva-contrasena': '/nueva-contrasena',

  // ── Dashboard pages (mantener URLs en español) ──
  '/dashboard': '/dashboard',
  '/proyectos': '/proyectos',
  '/editor/[id]': '/editor/[id]',
  '/editor/[id]/config': '/editor/[id]/config',
  '/editor/[id]/tipologias': '/editor/[id]/tipologias',
  '/editor/[id]/galeria': '/editor/[id]/galeria',
  '/editor/[id]/ubicacion': '/editor/[id]/ubicacion',
  '/editor/[id]/videos': '/editor/[id]/videos',
  '/editor/[id]/torres': '/editor/[id]/torres',
  '/editor/[id]/fachadas': '/editor/[id]/fachadas',
  '/editor/[id]/planos': '/editor/[id]/planos',
  '/editor/[id]/disponibilidad': '/editor/[id]/disponibilidad',
  '/editor/[id]/cotizador': '/editor/[id]/cotizador',
  '/editor/[id]/inventario': '/editor/[id]/inventario',
  '/editor/[id]/dominio': '/editor/[id]/dominio',
  '/editor/[id]/webhooks': '/editor/[id]/webhooks',
  '/editor/[id]/tour': '/editor/[id]/tour',
  '/editor/[id]/recursos': '/editor/[id]/recursos',
  '/editor/[id]/avances': '/editor/[id]/avances',
  '/editor/[id]/estadisticas': '/editor/[id]/estadisticas',
  '/leads': '/leads',
  '/analytics': '/analytics',
  '/equipo': '/equipo',
  '/cuenta': '/cuenta',
  '/ayuda': '/ayuda',
  '/disponibilidad': '/disponibilidad',
  '/cotizador': '/cotizador',
  '/cotizaciones': '/cotizaciones',

  // ── Microsite pages (mantener URLs en español) ──
  '/sites/[slug]': '/sites/[slug]',
  '/sites/[slug]/tipologias': '/sites/[slug]/tipologias',
  '/sites/[slug]/galeria': '/sites/[slug]/galeria',
  '/sites/[slug]/ubicacion': '/sites/[slug]/ubicacion',
  '/sites/[slug]/videos': '/sites/[slug]/videos',
  '/sites/[slug]/contacto': '/sites/[slug]/contacto',
  '/sites/[slug]/tour': '/sites/[slug]/tour',
  '/sites/[slug]/brochure': '/sites/[slug]/brochure',
  '/sites/[slug]/explorar': '/sites/[slug]/explorar',

  // ── Platform Admin ──
  '/admin': '/admin',
  '/admin/usuarios': '/admin/usuarios',
} as const;

export type Pathnames = typeof pathnames;
