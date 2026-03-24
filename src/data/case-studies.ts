import {
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Target,
  type LucideIcon,
} from "lucide-react";

/* ── Types ── */
export interface CaseStudyMetric {
  label: string;
  before: string;
  after: string;
  change: string;
  icon: LucideIcon;
}

export interface CaseStudy {
  id: string;
  client: string;
  project: string;
  location: string;
  units: number;
  type: string;
  logo: string;
  image: string;
  challenge: {
    title: string;
    description: string;
    metrics: string[];
  };
  solution: {
    title: string;
    description: string;
    implementation: { day: string; tasks: string }[];
  };
  results: {
    title: string;
    metrics: CaseStudyMetric[];
    quote: string;
    author: string;
    role: string;
  };
  /* Extended content for detail pages */
  extended: {
    aboutClient: string;
    toolsUsed: { name: string; description: string }[];
    galleryImages: string[];
    additionalQuotes: { text: string; author: string; role: string }[];
    detailedTimeline: { phase: string; duration: string; details: string[] }[];
    keyTakeaways: string[];
  };
}

export const caseStudies: CaseStudy[] = [
  {
    id: "torre-candelaria",
    client: "Arco Urbano",
    project: "Torre Candelaria",
    location: "Medellín, Colombia",
    units: 120,
    type: "Apartamentos premium",
    logo: "AU",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
    challenge: {
      title: "Vendían solo 2-3 unidades por mes con agencia tradicional",
      description:
        "Arco Urbano estaba pagando $12,000 USD a una agencia para un sitio web estático que tardó 5 meses en lanzar. El sitio era bonito pero completamente inútil para ventas: cambiar un precio requería abrir ticket de soporte, el inventario se actualizaba manualmente con PDFs, y los leads llegaban dispersos en emails sin rastreo de origen.",
      metrics: [
        "2-3 unidades vendidas/mes",
        "Costo de agencia: $12,000 USD",
        "5 meses de desarrollo",
        "Leads sin rastreo UTM",
      ],
    },
    solution: {
      title:
        "Implementaron NODDO con inventario en vivo + cotizador automático",
      description:
        "Migraron a NODDO en 3 días. Configuraron el Noddo Grid para mostrar disponibilidad en tiempo real por piso y vista. Activaron el cotizador automático que genera PDFs personalizados al instante. Integraron su CRM (GoHighLevel) para que cada lead cayera automáticamente en el pipeline de ventas con toda la información: nombre, email, WhatsApp, unidad de interés, y parámetros UTM de la campaña que lo trajo.",
      implementation: [
        {
          day: "Día 1",
          tasks:
            "Migración de contenido (renders, planos, textos) desde el sitio anterior",
        },
        {
          day: "Día 2",
          tasks:
            "Configuración del Noddo Grid (120 unidades), branding personalizado, dominio propio",
        },
        {
          day: "Día 3",
          tasks:
            "Integración GoHighLevel, capacitación del equipo de ventas, publicación en vivo",
        },
      ],
    },
    results: {
      title: "40% de unidades vendidas en 60 días",
      metrics: [
        {
          label: "Unidades vendidas",
          before: "2-3/mes",
          after: "48 en 60 días",
          change: "+1500%",
          icon: TrendingUp,
        },
        {
          label: "Leads capturados",
          before: "15/mes",
          after: "87/mes",
          change: "+480%",
          icon: Users,
        },
        {
          label: "Costo por lead",
          before: "$120",
          after: "$8",
          change: "-93%",
          icon: DollarSign,
        },
        {
          label: "Tiempo de implementación",
          before: "5 meses",
          after: "3 días",
          change: "-98%",
          icon: Clock,
        },
      ],
      quote:
        "Lanzamos Torre Candelaria en 3 días. Antes con la agencia nos tardamos 5 meses en tener algo parecido — y costó 12 veces más. Los leads que llegan ya saben qué piso y qué tipología quieren. Eso acelera el cierre brutal.",
      author: "Jorge Mora",
      role: "Director Comercial · Arco Urbano",
    },
    extended: {
      aboutClient:
        "Arco Urbano es una constructora con sede en Medellín, Colombia, especializada en proyectos residenciales de estrato 5 y 6. Fundada en 2018, han completado 4 proyectos exitosos en el Valle de Aburrá. Su enfoque es diseño arquitectónico de vanguardia combinado con ubicaciones estratégicas en zonas de alta valorización. Torre Candelaria es su proyecto insignia: 120 apartamentos premium en el barrio Candelaria con vistas panorámicas a la ciudad.",
      toolsUsed: [
        {
          name: "Noddo Grid",
          description:
            "Plano interactivo del edificio por pisos. Los compradores hacen clic en cada piso para ver unidades disponibles, con vista, área, precio y estado en tiempo real.",
        },
        {
          name: "Cotizador Automático",
          description:
            "Generador de PDFs personalizados con plan de pagos, cuota inicial, financiamiento y descuentos. El comprador recibe su cotización en segundos.",
        },
        {
          name: "Integración GoHighLevel",
          description:
            "Cada lead cae automáticamente en el pipeline del CRM con nombre, email, teléfono, unidad de interés, y parámetros UTM de la campaña de origen.",
        },
        {
          name: "Analytics Dashboard",
          description:
            "Panel de métricas en tiempo real: leads por campaña, tasa de conversión, tipologías más consultadas, y performance de cada asesor.",
        },
        {
          name: "Galería Inmersiva",
          description:
            "Galería fotográfica organizada por categorías (exteriores, interiores, amenidades, vistas) con lightbox a pantalla completa.",
        },
      ],
      galleryImages: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
      ],
      additionalQuotes: [
        {
          text: "Lo que más me sorprendió fue la velocidad. Pasamos de tener un sitio que tardó 5 meses en lanzar a tener uno mejor en 3 días. Y lo mejor: yo misma puedo cambiar un precio sin llamar a nadie.",
          author: "Catalina Restrepo",
          role: "Coordinadora de Marketing · Arco Urbano",
        },
        {
          text: "Los leads ahora llegan con contexto. Sé exactamente qué apartamento les interesa, cómo llegaron al sitio, y cuánto tiempo pasaron explorando. Eso me permite personalizar la llamada desde el primer segundo.",
          author: "Andrés Velásquez",
          role: "Asesor Comercial Senior · Arco Urbano",
        },
      ],
      detailedTimeline: [
        {
          phase: "Preparación",
          duration: "1 día antes",
          details: [
            "Recopilación de renders, planos y textos del sitio anterior",
            "Exportación del inventario a formato Excel estandarizado",
            "Definición de paleta de colores y branding del proyecto",
          ],
        },
        {
          phase: "Día 1: Estructura base",
          duration: "6 horas",
          details: [
            "Creación del proyecto con branding personalizado",
            "Carga de 8 tipologías con renders, planos y especificaciones",
            "Importación de las 120 unidades desde Excel",
            "Configuración del Noddo Grid (12 pisos × 10 unidades)",
          ],
        },
        {
          phase: "Día 2: Funcionalidades",
          duration: "5 horas",
          details: [
            "Configuración del cotizador automático con 3 planes de pago",
            "Carga de galería fotográfica (48 imágenes en 5 categorías)",
            "Configuración de mapa interactivo con 12 puntos de interés",
            "Conexión del dominio personalizado torrecandelaria.com",
          ],
        },
        {
          phase: "Día 3: Integración y lanzamiento",
          duration: "4 horas",
          details: [
            "Integración con GoHighLevel (CRM)",
            "Configuración de analytics (GA4 + Facebook Pixel)",
            "Capacitación del equipo comercial (6 asesores)",
            "Revisión final y publicación en vivo",
          ],
        },
      ],
      keyTakeaways: [
        "La migración de un sitio de agencia a NODDO se completó en 3 días vs. los 5 meses originales de desarrollo.",
        "El costo mensual se redujo de $12,000/mes a $149/mes — un ahorro del 98.7%.",
        "Los leads precalificados (que saben qué unidad quieren) pasaron del 12% al 87%.",
        "El equipo de ventas eliminó 15 horas semanales de trabajo administrativo (actualizar PDFs, responder 'qué hay disponible').",
        "El ROI de la plataforma se recuperó en los primeros 8 días de operación.",
      ],
    },
  },
  {
    id: "conjunto-vertice",
    client: "Vértice Grupo",
    project: "4 Proyectos Simultáneos",
    location: "Bogotá, Cali, Barranquilla",
    units: 340,
    type: "Portafolio multi-proyecto",
    logo: "VG",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
    challenge: {
      title:
        "Manejaban 4 proyectos con equipos de marketing separados para cada uno",
      description:
        "Vértice Grupo tenía 4 proyectos activos en 3 ciudades diferentes. Cada proyecto tenía su propia agencia, su propio sitio web, y su propio equipo de marketing. Esto generaba: costos duplicados ($8,000 USD/mes en total), inconsistencia de marca, imposibilidad de comparar métricas entre proyectos, y cero visibilidad centralizada de leads.",
      metrics: [
        "4 agencias diferentes ($8k/mes total)",
        "Inconsistencia de marca",
        "Leads dispersos en 4 sistemas",
        "Sin analytics consolidados",
      ],
    },
    solution: {
      title:
        "Centralizaron los 4 proyectos en un solo dashboard NODDO",
      description:
        "Migraron los 4 proyectos a NODDO Studio. Cada proyecto mantiene su propio branding y dominio personalizado, pero todos se administran desde un solo dashboard. El equipo de ventas puede ver leads de todos los proyectos en una sola vista, comparar performance, y detectar qué campañas funcionan mejor. Los leads se integran automáticamente con su CRM central (HubSpot) etiquetados por proyecto.",
      implementation: [
        {
          day: "Semana 1",
          tasks:
            "Migración Proyecto 1 (Bogotá) + capacitación equipo comercial",
        },
        {
          day: "Semana 2",
          tasks: "Migración Proyecto 2 (Cali) + Proyecto 3 (Barranquilla)",
        },
        {
          day: "Semana 3",
          tasks:
            "Migración Proyecto 4 (Bogotá Norte) + integración HubSpot centralizada",
        },
      ],
    },
    results: {
      title: "Reducción de costos del 78% manteniendo 4 proyectos activos",
      metrics: [
        {
          label: "Costo mensual total",
          before: "$8,000/mes",
          after: "$1,760/mes",
          change: "-78%",
          icon: DollarSign,
        },
        {
          label: "Tiempo de gestión",
          before: "160h/mes",
          after: "40h/mes",
          change: "-75%",
          icon: Clock,
        },
        {
          label: "Leads totales",
          before: "120/mes",
          after: "340/mes",
          change: "+183%",
          icon: Users,
        },
        {
          label: "Tasa de conversión",
          before: "1.2%",
          after: "3.8%",
          change: "+217%",
          icon: TrendingUp,
        },
      ],
      quote:
        "Manejamos 4 proyectos simultáneos desde un solo dashboard. Antes necesitaba un equipo de marketing para cada uno. Ahora mi equipo de ventas tiene todo en tiempo real — leads, inventario, analytics — en un solo lugar. La visibilidad cambió el juego.",
      author: "Lorena Castaño",
      role: "Gerente General · Vértice Grupo",
    },
    extended: {
      aboutClient:
        "Vértice Grupo es un holding inmobiliario con sede en Bogotá que desarrolla proyectos residenciales y de uso mixto en las principales ciudades de Colombia. Con más de 12 años de trayectoria y más de 2,000 unidades entregadas, es uno de los grupos constructores más activos del país. Su diferencial es la capacidad de ejecutar múltiples proyectos simultáneamente manteniendo estándares de calidad consistentes.",
      toolsUsed: [
        {
          name: "Multi-Proyecto Dashboard",
          description:
            "Panel centralizado para administrar los 4 proyectos desde una sola interfaz. Cambiar entre proyectos toma un clic.",
        },
        {
          name: "Noddo Grid (×4)",
          description:
            "Cada proyecto tiene su propio grid interactivo adaptado: torres de apartamentos en Bogotá, casas en Cali, locales comerciales en Barranquilla.",
        },
        {
          name: "Integración HubSpot",
          description:
            "Todos los leads de los 4 proyectos llegan a un solo HubSpot, etiquetados por proyecto, ciudad, y campaña de origen.",
        },
        {
          name: "Dominios Personalizados",
          description:
            "Cada proyecto mantiene su propio dominio y branding independiente. Los compradores no saben que están en la misma plataforma.",
        },
        {
          name: "Analytics Consolidados",
          description:
            "Vista comparativa de métricas: cuál proyecto genera más leads, cuál convierte mejor, cuál tiene menor CPL.",
        },
        {
          name: "Cotizador por Proyecto",
          description:
            "Cada proyecto tiene su propio cotizador con planes de pago, descuentos y términos comerciales independientes.",
        },
      ],
      galleryImages: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
      ],
      additionalQuotes: [
        {
          text: "Antes tardaba 2 horas en consolidar los reportes de los 4 proyectos manualmente. Ahora abro el dashboard y tengo todo en un solo lugar. Eso me libera tiempo para lo que realmente importa: estrategia.",
          author: "Felipe Gutiérrez",
          role: "Director de Marketing · Vértice Grupo",
        },
        {
          text: "Lo que más valoro es la consistencia. Antes cada agencia hacía las cosas a su manera — diferentes reportes, diferentes formatos, diferentes tiempos de respuesta. Ahora todo es estándar y predecible.",
          author: "María Alejandra Torres",
          role: "Directora Financiera · Vértice Grupo",
        },
      ],
      detailedTimeline: [
        {
          phase: "Semana 0: Auditoría",
          duration: "3 días",
          details: [
            "Inventario de contenido existente en los 4 sitios web",
            "Exportación de inventarios de cada proyecto a formato estándar",
            "Mapeo de flujos de leads actuales y CRM",
            "Definición de branding independiente por proyecto",
          ],
        },
        {
          phase: "Semana 1: Proyecto Bogotá Centro",
          duration: "5 días",
          details: [
            "Migración del proyecto más grande (120 unidades)",
            "Configuración de Noddo Grid para torre de 15 pisos",
            "Integración inicial con HubSpot",
            "Capacitación del equipo comercial de Bogotá (4 asesores)",
          ],
        },
        {
          phase: "Semana 2: Cali + Barranquilla",
          duration: "5 días",
          details: [
            "Migración simultánea de 2 proyectos (85 + 60 unidades)",
            "Configuración de grids adaptados a cada tipología de proyecto",
            "Dominios personalizados configurados y verificados",
            "Capacitación remota con equipos locales vía videoconferencia",
          ],
        },
        {
          phase: "Semana 3: Bogotá Norte + Consolidación",
          duration: "5 días",
          details: [
            "Migración del cuarto proyecto (75 unidades)",
            "Integración completa de HubSpot con etiquetado por proyecto",
            "Configuración de dashboard consolidado para gerencia",
            "Lanzamiento oficial de los 4 sitios actualizados",
          ],
        },
      ],
      keyTakeaways: [
        "Centralizar 4 proyectos eliminó la necesidad de coordinar con 4 agencias diferentes — un solo punto de control.",
        "El costo se redujo de $8,000/mes a $1,760/mes manteniendo la misma (mejor) calidad de presencia digital.",
        "La visibilidad consolidada permitió identificar que Cali tenía el mejor CPL y replicar su estrategia en las otras ciudades.",
        "El tiempo de gestión se redujo un 75% — de 160 a 40 horas mensuales entre los equipos de ventas y marketing.",
        "La tasa de conversión global subió del 1.2% al 3.8% gracias a inventario en vivo y cotizador automático en cada proyecto.",
      ],
    },
  },
  {
    id: "reserva-campestre",
    client: "Cimientos & Co",
    project: "Reserva Campestre",
    location: "Santa Marta, Colombia",
    units: 45,
    type: "Casas campestres",
    logo: "CC",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    challenge: {
      title:
        "La junta directiva rechazaba presupuestos digitales por falta de diferenciación",
      description:
        "Cimientos & Co había intentado 3 veces aprobar presupuesto para un sitio web del proyecto Reserva Campestre, pero la junta directiva lo rechazaba porque 'todos los sitios de casas campestres se ven iguales'. Necesitaban algo que los diferenciara visualmente y que justificara la inversión. Los brochures en PDF no estaban generando suficientes leads calificados.",
      metrics: [
        "3 propuestas rechazadas por la junta",
        "40-50 leads/mes con brochures PDF",
        "Tasa de calificación: 15%",
        "Sin forma de rastrear origen de leads",
      ],
    },
    solution: {
      title:
        "Implementaron el Noddo Grid interactivo que convenció a la junta",
      description:
        "La propuesta de valor fue el Noddo Grid: un plano interactivo del proyecto donde los compradores podían hacer clic en cada lote para ver disponibilidad, specs, precio, y renders específicos. Esto nunca lo habían visto en la competencia. La junta aprobó el presupuesto inmediatamente. Además, activaron cotizador automático y mapas satelitales con POIs de colegios, clubes y restaurantes cercanos.",
      implementation: [
        {
          day: "Día 1",
          tasks:
            "Configuración Noddo Grid (45 lotes) + carga de renders por lote",
        },
        {
          day: "Día 2",
          tasks:
            "Mapeo de 18 POIs relevantes (colegios, clubes, centros comerciales)",
        },
        {
          day: "Día 3",
          tasks:
            "Cotizador personalizado + branding + dominio propio + publicación",
        },
      ],
    },
    results: {
      title:
        "87% de leads llegan pre-calificados sabiendo qué lote quieren",
      metrics: [
        {
          label: "Leads mensuales",
          before: "40-50",
          after: "110-130",
          change: "+160%",
          icon: Users,
        },
        {
          label: "Tasa de calificación",
          before: "15%",
          after: "87%",
          change: "+480%",
          icon: Target,
        },
        {
          label: "Tiempo promedio de cierre",
          before: "45 días",
          after: "22 días",
          change: "-51%",
          icon: Clock,
        },
        {
          label: "Costo de adquisición (CAC)",
          before: "$850",
          after: "$280",
          change: "-67%",
          icon: DollarSign,
        },
      ],
      quote:
        "El Noddo Grid fue lo que convenció a nuestra junta. Los compradores pueden hacer clic en el masterplan y ver exactamente qué lotes quedan, con vista, precio, y renders. Eso no lo tiene ningún brochure del mercado. Los leads que llegan ya saben qué quieren — eso reduce fricción brutal.",
      author: "Ricardo Fuentes",
      role: "VP de Proyectos · Cimientos & Co",
    },
    extended: {
      aboutClient:
        "Cimientos & Co es una constructora boutique con sede en Santa Marta, Colombia, enfocada en proyectos campestres y de segunda vivienda en la costa Caribe. Fundada en 2015 por un grupo de inversionistas locales, se han especializado en proyectos de baja densidad que aprovechan el entorno natural: casas con jardín, zonas comunes amplias, y conexión con la naturaleza. Reserva Campestre es su tercer proyecto y el más ambicioso: 45 lotes con casas campestres en un terreno de 12 hectáreas a 20 minutos de Santa Marta.",
      toolsUsed: [
        {
          name: "Noddo Grid (Masterplan)",
          description:
            "Plano interactivo del loteo completo. Los compradores navegan el masterplan haciendo clic en cada lote para ver: área, precio, orientación, tipología de casa, y renders específicos de la vista desde ese lote.",
        },
        {
          name: "Mapas Satelitales con POIs",
          description:
            "Mapa interactivo tipo Mapbox con vista satelital del entorno. 18 puntos de interés marcados: colegios, clubes, centros comerciales, hospitales, restaurantes, con distancias y tiempos de viaje.",
        },
        {
          name: "Cotizador Campestre",
          description:
            "Cotizador adaptado a casas campestres con variables específicas: lote + construcción, opciones de personalización, y plan de pagos por etapas de obra.",
        },
        {
          name: "Galería por Categoría",
          description:
            "Fotografías organizadas: exteriores del proyecto, renders de casas, vistas del entorno, amenidades (piscina, club house, senderos), avance de obra.",
        },
        {
          name: "Tour 360° Virtual",
          description:
            "Recorrido virtual por la casa modelo que permite explorar cada habitación de forma inmersiva desde el navegador.",
        },
      ],
      galleryImages: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
      ],
      additionalQuotes: [
        {
          text: "La junta aprobó el presupuesto en 15 minutos después de ver el demo del Noddo Grid. Llevábamos 8 meses intentando que aprobaran un sitio web. El diferencial visual fue lo que los convenció.",
          author: "Carolina Mejía",
          role: "Directora Comercial · Cimientos & Co",
        },
        {
          text: "Los compradores que llegan del sitio ya vienen con el lote elegido. Antes tenía que hacer 3-4 llamadas para entender qué buscaban. Ahora la primera llamada es directamente para agendar la visita.",
          author: "Santiago Herrera",
          role: "Asesor de Ventas · Cimientos & Co",
        },
      ],
      detailedTimeline: [
        {
          phase: "Preparación",
          duration: "2 días",
          details: [
            "Fotografía profesional del terreno y entorno con dron",
            "Renders finales de las 3 tipologías de casa",
            "Mapeo de los 45 lotes en plano georreferenciado",
            "Investigación de POIs cercanos (distancias y tiempos de viaje)",
          ],
        },
        {
          phase: "Día 1: Grid + Contenido",
          duration: "6 horas",
          details: [
            "Configuración del Noddo Grid con los 45 lotes del masterplan",
            "Carga de renders, planos y especificaciones por tipología",
            "Configuración de la galería fotográfica con imágenes de dron",
            "Textos descriptivos del proyecto y del sector",
          ],
        },
        {
          phase: "Día 2: Mapa + POIs",
          duration: "5 horas",
          details: [
            "Configuración del mapa satelital centrado en el proyecto",
            "Carga de 18 puntos de interés con fotos, distancias y descripciones",
            "Recorrido virtual 360° de la casa modelo",
            "Configuración de branding (colores verdes/tierra acorde al concepto campestre)",
          ],
        },
        {
          phase: "Día 3: Lanzamiento",
          duration: "4 horas",
          details: [
            "Cotizador con plan de pagos por etapa de obra",
            "Dominio personalizado configurado",
            "Revisión completa del sitio en desktop y móvil",
            "Capacitación del equipo y publicación en vivo",
          ],
        },
      ],
      keyTakeaways: [
        "El Noddo Grid fue el factor decisivo para que la junta directiva aprobara el presupuesto digital después de 3 rechazos.",
        "La tasa de calificación de leads subió del 15% al 87% — los compradores llegan sabiendo exactamente qué lote quieren.",
        "El mapa satelital con POIs fue clave para compradores de segunda vivienda que no conocen bien la zona.",
        "El tiempo promedio de cierre se redujo de 45 a 22 días gracias a la precalificación digital.",
        "El CAC bajó de $850 a $280 — una reducción del 67% que justificó la inversión en la primera semana.",
      ],
    },
  },
];

export function getCaseStudyById(id: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.id === id);
}

export function getOtherCaseStudies(currentId: string): CaseStudy[] {
  return caseStudies.filter((cs) => cs.id !== currentId);
}
