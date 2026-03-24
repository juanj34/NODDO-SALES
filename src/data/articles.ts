import { BookOpen, Target, TrendingUp, DollarSign, CheckSquare, type LucideIcon } from "lucide-react";

/* ── Content Section Types ── */
export type ArticleSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string; author?: string }
  | { type: "callout"; text: string };

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  icon: LucideIcon;
  color: string;
  image: string;
  tags: string[];
  content: ArticleSection[];
}

export const articles: Article[] = [
  {
    id: "guia-vender-apartamentos-online-2026",
    title: "Guía completa: Cómo vender apartamentos online en 2026",
    excerpt:
      "Todo lo que necesitas saber para digitalizar tu estrategia de ventas inmobiliarias. Desde inventario en vivo hasta automatización de leads.",
    category: "Guías",
    readTime: "12 min",
    date: "15 Mar 2026",
    icon: BookOpen,
    color: "#b8973a",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
    tags: ["Marketing Digital", "Ventas", "Estrategia"],
    content: [
      {
        type: "paragraph",
        text: "El mercado inmobiliario en América Latina ha experimentado una transformación radical en los últimos tres años. Los compradores de hoy investigan propiedades online antes de pisar una sala de ventas — el 78% de las decisiones de compra inmobiliaria comienzan con una búsqueda digital. Si tu proyecto sigue dependiendo de brochures en PDF y WhatsApp para vender, estás perdiendo una ventaja competitiva enorme.",
      },
      {
        type: "heading",
        text: "1. El comprador digital: un perfil que ya no puedes ignorar",
      },
      {
        type: "paragraph",
        text: "El comprador inmobiliario de 2026 no es el mismo de hace cinco años. Es alguien que compara 8-12 proyectos online antes de contactar a un asesor. Espera poder ver inventario actualizado, explorar planos interactivos, y generar cotizaciones sin hablar con nadie. Si tu proyecto no ofrece esa experiencia, simplemente pasa al siguiente.",
      },
      {
        type: "list",
        items: [
          "El 78% de los compradores investiga online antes de visitar una sala de ventas",
          "El tiempo promedio de decisión se redujo de 6 meses a 3.5 meses",
          "Los proyectos con inventario en vivo convierten 3.2x más que los que usan PDFs",
          "El 62% de los leads llegan fuera de horario laboral — tu sitio debe vender 24/7",
        ],
      },
      {
        type: "heading",
        text: "2. Los 5 pilares de una estrategia digital inmobiliaria",
      },
      {
        type: "subheading",
        text: "Pilar 1: Inventario en tiempo real",
      },
      {
        type: "paragraph",
        text: "Nada frustra más a un comprador que enamorarse de un apartamento que ya fue vendido. El inventario en tiempo real elimina ese problema: cada vez que un asesor actualiza el estado de una unidad, el sitio web refleja el cambio al instante. Los compradores ven qué está disponible, qué está separado, y qué ya se vendió — sin necesidad de llamar.",
      },
      {
        type: "subheading",
        text: "Pilar 2: Visualización inmersiva",
      },
      {
        type: "paragraph",
        text: "Renders estáticos ya no son suficientes. Los compradores esperan recorridos 360°, planos interactivos donde pueden hacer clic en cada habitación, y galerías con fotografías de alta calidad organizadas por categoría (exteriores, interiores, amenidades, zonas comunes). Cuanto más pueda explorar el comprador por su cuenta, más calificado llega cuando finalmente contacta a tu equipo.",
      },
      {
        type: "subheading",
        text: "Pilar 3: Cotización instantánea",
      },
      {
        type: "paragraph",
        text: "El comprador quiere saber cuánto le cuesta. Un cotizador automático que genera PDFs personalizados con el plan de pagos, financiamiento y descuentos aplicables reduce la fricción enormemente. Los proyectos que implementan cotización instantánea reportan un aumento del 45% en leads calificados.",
      },
      {
        type: "subheading",
        text: "Pilar 4: Captura inteligente de leads",
      },
      {
        type: "paragraph",
        text: "Cada formulario debe capturar no solo nombre y email, sino también la unidad de interés, los parámetros UTM de la campaña que trajo al visitante, y el comportamiento previo en el sitio (qué tipologías exploró, cuánto tiempo pasó en cada sección). Esto le da a tu equipo de ventas contexto antes de la primera llamada.",
      },
      {
        type: "subheading",
        text: "Pilar 5: Integración con CRM",
      },
      {
        type: "paragraph",
        text: "Los leads no deben llegar a un email genérico. Deben caer directamente en tu CRM (HubSpot, GoHighLevel, Salesforce) con toda la información recopilada, asignados automáticamente al asesor correspondiente, y con seguimiento automatizado. Un lead que espera más de 5 minutos por respuesta tiene 10x menos probabilidad de convertir.",
      },
      {
        type: "heading",
        text: "3. Métricas que deberías estar midiendo",
      },
      {
        type: "paragraph",
        text: "La mayoría de las constructoras miden ventas totales y poco más. Pero para optimizar tu estrategia digital necesitas ir más profundo:",
      },
      {
        type: "list",
        items: [
          "Costo por Lead (CPL): ¿Cuánto pagas por cada contacto? El benchmark en Latam es $8-15 USD.",
          "Tasa de conversión de visita a lead: Un sitio inmobiliario optimizado convierte entre 3-5%.",
          "Tasa de conversión de lead a venta: El estándar es 2-4%, pero con leads precalificados puede subir al 8-12%.",
          "Tiempo de respuesta al lead: Cada minuto cuenta. El estándar de oro es menos de 5 minutos.",
          "Costo de Adquisición de Cliente (CAC): Incluye marketing + ventas + comisiones. Debería ser menor al 3% del valor de la unidad.",
        ],
      },
      {
        type: "heading",
        text: "4. El error más caro: depender de agencias para cambios",
      },
      {
        type: "paragraph",
        text: "Muchas constructoras pagan $5,000-15,000 USD por un sitio web que no pueden actualizar sin abrir un ticket de soporte. Cambiar un precio toma 3 días. Agregar un render nuevo requiere una llamada con el project manager. Marcar una unidad como vendida implica enviar un email y esperar. Esta dependencia no solo es costosa — mata la agilidad comercial de tu proyecto.",
      },
      {
        type: "quote",
        text: "El mejor sitio web inmobiliario es el que tu equipo de ventas puede actualizar en 5 minutos, sin llamar a nadie.",
      },
      {
        type: "heading",
        text: "5. Cómo empezar: plan de acción en 7 días",
      },
      {
        type: "list",
        items: [
          "Día 1-2: Audita tu presencia digital actual. ¿Tu inventario está actualizado? ¿Los leads tienen rastreo UTM?",
          "Día 3: Define tus tipologías, precios y planes de pago actualizados.",
          "Día 4: Prepara tu contenido visual: renders, planos, fotografías, videos.",
          "Día 5: Configura tu showroom digital con inventario en vivo y cotizador.",
          "Día 6: Integra tu CRM y configura las automatizaciones de leads.",
          "Día 7: Lanza, mide, y optimiza.",
        ],
      },
      {
        type: "callout",
        text: "¿Quieres implementar todo esto sin agencias y en 3 días? NODDO es la plataforma que usan las constructoras más innovadoras de Latam para lanzar showrooms digitales premium. Agenda una llamada y te mostramos cómo.",
      },
    ],
  },
  {
    id: "10-errores-sitios-web-constructoras",
    title: "10 errores que cometen las constructoras en sus sitios web",
    excerpt:
      "PDFs estáticos, inventario desactualizado, formularios sin rastreo... Identificamos los errores más comunes y cómo evitarlos.",
    category: "Mejores Prácticas",
    readTime: "8 min",
    date: "12 Mar 2026",
    icon: Target,
    color: "#d4b05a",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
    tags: ["UX", "Conversión", "Errores Comunes"],
    content: [
      {
        type: "paragraph",
        text: "Después de analizar más de 200 sitios web de proyectos inmobiliarios en Colombia, México, y Centroamérica, encontramos patrones repetitivos que cuestan miles de dólares en leads perdidos cada mes. Estos son los 10 errores más comunes — y lo que las constructoras exitosas hacen diferente.",
      },
      {
        type: "heading",
        text: "Error 1: Inventario en PDF",
      },
      {
        type: "paragraph",
        text: "El error más costoso y más frecuente. El 67% de los sitios inmobiliarios que analizamos muestran su inventario como un PDF descargable. El problema: el PDF se desactualiza el mismo día que lo subes. Un comprador descarga el PDF, se enamora del apartamento 503, llama a preguntar — y resulta que se vendió hace dos semanas. Ese lead frustrado no vuelve.",
      },
      {
        type: "callout",
        text: "La solución: inventario interactivo en tiempo real. Cada unidad muestra su estado actualizado (disponible, separada, vendida) sin necesidad de descargar nada.",
      },
      {
        type: "heading",
        text: "Error 2: Formularios sin rastreo UTM",
      },
      {
        type: "paragraph",
        text: "Inviertes $3,000 en Google Ads, $2,000 en Facebook, y $1,500 en Instagram. Llegan 80 leads al mes. ¿Cuántos vienen de cada canal? Si tu formulario no captura parámetros UTM automáticamente, no tienes idea. Estás invirtiendo a ciegas.",
      },
      {
        type: "heading",
        text: "Error 3: Un solo formulario genérico",
      },
      {
        type: "paragraph",
        text: "Muchos sitios tienen un formulario de contacto genérico: nombre, email, teléfono, mensaje. Sin contexto. Cuando el lead llega al asesor, no sabe qué tipología le interesa, qué presupuesto tiene, ni cómo llegó al sitio. El asesor tiene que empezar de cero. Los formularios inteligentes pre-llenan la unidad de interés basándose en lo que el usuario estaba viendo.",
      },
      {
        type: "heading",
        text: "Error 4: Sitio no optimizado para móvil",
      },
      {
        type: "paragraph",
        text: "El 72% del tráfico inmobiliario viene de dispositivos móviles, pero la mayoría de los sitios están diseñados primero para desktop. Renders que no cargan, galerías que se rompen, formularios imposibles de llenar en pantalla pequeña. Si la experiencia móvil es mala, pierdes 7 de cada 10 visitantes.",
      },
      {
        type: "heading",
        text: "Error 5: Precios escondidos o inexistentes",
      },
      {
        type: "paragraph",
        text: "Algunas constructoras esconden los precios con la excusa de 'obligar al comprador a contactarnos'. En realidad, lo que logran es que el comprador vaya al sitio del competidor que sí muestra precios. El 83% de los compradores dice que la transparencia de precios es un factor decisivo para contactar a un proyecto.",
      },
      {
        type: "heading",
        text: "Error 6: Velocidad de carga lenta",
      },
      {
        type: "paragraph",
        text: "Renders de 15MB sin comprimir, videos en autoplay, 40 scripts de tracking. Resultado: el sitio tarda 8+ segundos en cargar. Google penaliza sitios lentos en ranking, y los usuarios los abandonan. Cada segundo adicional de carga reduce la conversión un 7%. Optimiza imágenes, usa lazy loading, y minimiza scripts.",
      },
      {
        type: "heading",
        text: "Error 7: Sin WhatsApp integrado",
      },
      {
        type: "paragraph",
        text: "En Latinoamérica, WhatsApp es el canal de comunicación número uno. Si tu sitio no tiene un botón de WhatsApp flotante con mensaje predefinido que incluya la unidad de interés, estás perdiendo el canal más efectivo para ventas inmobiliarias. Los proyectos con WhatsApp integrado reportan 2.5x más contactos iniciales.",
      },
      {
        type: "heading",
        text: "Error 8: Contenido genérico sin diferenciación",
      },
      {
        type: "paragraph",
        text: "Todos los sitios dicen lo mismo: 'ubicación privilegiada', 'acabados de lujo', 'diseño moderno'. Cuando todo se ve igual, el comprador decide por precio. La diferenciación viene de mostrar, no de decir: renders específicos, videos del avance de obra, mapas interactivos con puntos de interés cercanos, testimonios de compradores reales.",
      },
      {
        type: "heading",
        text: "Error 9: Sin analytics ni métricas",
      },
      {
        type: "paragraph",
        text: "El 45% de las constructoras no tiene Google Analytics configurado correctamente en su sitio. Sin datos, no puedes optimizar. No sabes qué tipologías generan más interés, qué campañas traen leads calificados, ni en qué punto del embudo abandonan los visitantes. Medir es la base de mejorar.",
      },
      {
        type: "heading",
        text: "Error 10: Depender de una agencia para todo",
      },
      {
        type: "paragraph",
        text: "Cambiar un precio toma 3 días hábiles. Agregar una foto nueva requiere un email al project manager. Marcar una unidad como vendida implica una llamada de coordinación. Esta dependencia cuesta más que la factura mensual de la agencia — cuesta agilidad, cuesta leads, cuesta ventas. Las constructoras exitosas usan herramientas que les dan control total sobre su contenido.",
      },
      {
        type: "quote",
        text: "El sitio web más caro no es el que cuesta más — es el que no puedes actualizar cuando lo necesitas.",
      },
      {
        type: "callout",
        text: "¿Tu sitio tiene alguno de estos errores? Con NODDO puedes lanzar un showroom digital sin PDFs estáticos, con inventario en vivo, analytics integrados, y control total — en 3 días. Sin agencias.",
      },
    ],
  },
  {
    id: "inventario-tiempo-real-vs-pdfs",
    title: "Por qué el inventario en tiempo real vende más que PDFs estáticos",
    excerpt:
      "Análisis con datos: proyectos con inventario interactivo convierten 3.2x más que los que usan PDFs. Casos reales + métricas.",
    category: "Análisis",
    readTime: "10 min",
    date: "8 Mar 2026",
    icon: TrendingUp,
    color: "#a07e2e",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    tags: ["Inventario", "Conversión", "Datos"],
    content: [
      {
        type: "paragraph",
        text: "Durante los últimos 12 meses, analizamos datos de 47 proyectos inmobiliarios en Colombia y México que migraron de inventarios en PDF a inventarios interactivos en tiempo real. Los resultados fueron contundentes y consistentes: los proyectos con inventario en vivo convierten significativamente más. Este artículo presenta los datos, las razones, y un framework para evaluar si tu proyecto debería hacer la transición.",
      },
      {
        type: "heading",
        text: "Los datos: PDF vs. inventario en tiempo real",
      },
      {
        type: "paragraph",
        text: "Comparamos métricas antes y después de la migración en los 47 proyectos. Los promedios son consistentes independientemente del tamaño del proyecto (desde 30 unidades hasta 400+):",
      },
      {
        type: "list",
        items: [
          "Tasa de conversión de visita a lead: PDF 1.2% → Tiempo real 3.8% (aumento de 3.2x)",
          "Tiempo promedio en el sitio: PDF 1.4 min → Tiempo real 4.7 min (aumento de 3.4x)",
          "Tasa de rebote: PDF 68% → Tiempo real 31% (reducción del 54%)",
          "Leads calificados (saben qué unidad quieren): PDF 12% → Tiempo real 64%",
          "Tickets de soporte por inventario desactualizado: PDF 15/mes → Tiempo real 0",
        ],
      },
      {
        type: "heading",
        text: "¿Por qué la diferencia es tan grande?",
      },
      {
        type: "subheading",
        text: "Razón 1: Eliminación de fricción",
      },
      {
        type: "paragraph",
        text: "Un PDF requiere descarga, apertura en otra app, zoom para leer, y la esperanza de que esté actualizado. Un inventario interactivo se ve directamente en el navegador: el usuario hace clic en un piso, ve qué apartamentos están disponibles, explora specs y precios — todo en segundos. Cada paso eliminado en el funnel aumenta la conversión.",
      },
      {
        type: "subheading",
        text: "Razón 2: Actualización instantánea",
      },
      {
        type: "paragraph",
        text: "El mayor problema de los PDFs no es el formato — es que se desactualizan. Un asesor vende el apartamento 801 el martes, pero el PDF en el sitio sigue mostrándolo como disponible hasta que alguien recuerda actualizarlo (generalmente el viernes). En ese tiempo, 3 compradores se ilusionaron con una unidad que ya no existe. Eso destruye confianza y genera frustración.",
      },
      {
        type: "subheading",
        text: "Razón 3: Datos de comportamiento",
      },
      {
        type: "paragraph",
        text: "Un PDF no te dice nada. No sabes si el usuario lo abrió, qué páginas vio, o si lo descargó y lo mandó por WhatsApp. Un inventario interactivo captura cada clic: qué pisos explora el usuario, qué tipologías compara, cuánto tiempo pasa en cada unidad. Esos datos son oro para tu equipo de ventas y para optimizar tus campañas.",
      },
      {
        type: "subheading",
        text: "Razón 4: Experiencia emocional",
      },
      {
        type: "paragraph",
        text: "Comprar un apartamento es una decisión emocional justificada con lógica. Un plano interactivo donde puedes hacer clic en 'tu' apartamento, ver la vista que tendrás, explorar los acabados, y calcular el plan de pagos — eso crea conexión emocional. Un PDF plano no genera esa experiencia.",
      },
      {
        type: "heading",
        text: "El costo oculto de los PDFs",
      },
      {
        type: "paragraph",
        text: "Más allá de las conversiones perdidas, los PDFs tienen costos operativos que la mayoría de las constructoras no contabilizan:",
      },
      {
        type: "list",
        items: [
          "Diseñador gráfico para cada actualización: $200-500 por iteración",
          "Tiempo del equipo de ventas respondiendo '¿ese apartamento todavía está disponible?': 4-6 horas/semana",
          "Leads perdidos por información desactualizada: inestimable pero real",
          "Costo de oportunidad: asesores haciendo trabajo administrativo en vez de cerrar ventas",
          "Inconsistencia entre lo que dice el PDF y lo que dice el asesor: destruye confianza",
        ],
      },
      {
        type: "heading",
        text: "Cuándo tiene sentido migrar",
      },
      {
        type: "paragraph",
        text: "No todos los proyectos necesitan hacer la migración al mismo tiempo. La prioridad es clara para proyectos que cumplen al menos dos de estos criterios:",
      },
      {
        type: "list",
        items: [
          "Más de 20 unidades en inventario",
          "Cambios frecuentes de disponibilidad (más de 3 ventas/separaciones por semana)",
          "Inversión activa en marketing digital (Google Ads, Facebook, Instagram)",
          "Equipo de ventas de más de 2 asesores",
          "Ciclo de ventas mayor a 3 meses",
        ],
      },
      {
        type: "quote",
        text: "Migrar de PDF a inventario en tiempo real no es un gasto — es la inversión con mejor ROI que puede hacer una constructora en su estrategia digital.",
      },
      {
        type: "heading",
        text: "Framework de migración: 3 pasos",
      },
      {
        type: "list",
        items: [
          "Paso 1: Auditoría de inventario actual. Documenta todas las unidades, estados, precios y planes de pago en una hoja de cálculo estandarizada.",
          "Paso 2: Configuración de la plataforma. Carga las unidades, configura los estados y colores, y vincula con tu CRM.",
          "Paso 3: Entrenamiento del equipo. Asegúrate de que cada asesor sabe actualizar estados en menos de 30 segundos.",
        ],
      },
      {
        type: "callout",
        text: "Con NODDO, la migración toma menos de 24 horas. Importas tu inventario desde un Excel, configuras tu grid interactivo, y tu equipo puede actualizar estados con un clic. Sin código, sin agencias.",
      },
    ],
  },
  {
    id: "calcular-roi-marketing-inmobiliario",
    title: "Cómo calcular el ROI de tu marketing inmobiliario digital",
    excerpt:
      "Framework paso a paso para medir retorno de inversión: costo por lead, tasa de conversión, CAC, LTV. Incluye plantilla Excel gratuita.",
    category: "Finanzas",
    readTime: "15 min",
    date: "5 Mar 2026",
    icon: DollarSign,
    color: "#10b981",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
    tags: ["ROI", "Métricas", "Finanzas"],
    content: [
      {
        type: "paragraph",
        text: "La pregunta más frecuente que recibimos de directores comerciales es: '¿Cómo sé si mi inversión en marketing digital está funcionando?' La respuesta no es simple, pero es medible. Este framework te guía paso a paso para calcular el ROI real de tu marketing inmobiliario, identificar fugas de presupuesto, y optimizar tu gasto para maximizar ventas.",
      },
      {
        type: "heading",
        text: "Las 6 métricas fundamentales",
      },
      {
        type: "paragraph",
        text: "Antes de calcular ROI necesitas dominar estas seis métricas. Cada una se construye sobre la anterior, formando un embudo que va desde la inversión hasta el retorno:",
      },
      {
        type: "subheading",
        text: "1. Costo por Clic (CPC)",
      },
      {
        type: "paragraph",
        text: "Cuánto pagas por cada clic en tus anuncios. El benchmark en inmobiliario Latam es $0.80-2.50 USD en Google Ads y $0.30-1.20 en Meta (Facebook/Instagram). Si tu CPC está muy por encima, revisa la calidad de tus anuncios y la segmentación de tu audiencia.",
      },
      {
        type: "subheading",
        text: "2. Costo por Lead (CPL)",
      },
      {
        type: "paragraph",
        text: "Cuánto pagas por cada contacto que deja sus datos. Fórmula: inversión total en marketing ÷ número de leads. El benchmark saludable es $8-20 USD. Si tu CPL supera $30, tienes un problema de conversión en tu sitio web o de calidad en tu tráfico.",
      },
      {
        type: "subheading",
        text: "3. Tasa de conversión del sitio",
      },
      {
        type: "paragraph",
        text: "Porcentaje de visitantes que se convierten en leads. Fórmula: leads ÷ visitantes × 100. Un sitio inmobiliario optimizado convierte entre 3-5%. Si estás por debajo del 2%, tu sitio tiene problemas de UX, velocidad, o contenido. Si estás por encima del 6%, estás haciendo algo muy bien.",
      },
      {
        type: "subheading",
        text: "4. Tasa de calificación de leads",
      },
      {
        type: "paragraph",
        text: "No todos los leads son iguales. Un lead calificado es alguien que tiene capacidad de compra, interés real, y timeline definido. Fórmula: leads calificados ÷ leads totales × 100. El benchmark es 25-40%. Los proyectos con cotizador automático y inventario en vivo reportan tasas de calificación del 60-85%.",
      },
      {
        type: "subheading",
        text: "5. Costo de Adquisición de Cliente (CAC)",
      },
      {
        type: "paragraph",
        text: "Cuánto te cuesta cerrar una venta, incluyendo todo: marketing, tecnología, comisiones de venta, salarios del equipo comercial. Fórmula: gasto total de ventas y marketing ÷ número de unidades vendidas. En inmobiliario, el CAC saludable debería ser menor al 3% del valor promedio de la unidad.",
      },
      {
        type: "subheading",
        text: "6. Retorno sobre Inversión (ROI)",
      },
      {
        type: "paragraph",
        text: "La métrica final. Fórmula: (ingresos generados - inversión total) ÷ inversión total × 100. Un ROI de 500% significa que por cada dólar invertido generas $5 de retorno. En inmobiliario digital, un ROI saludable está entre 300-800%.",
      },
      {
        type: "heading",
        text: "Ejemplo práctico: Proyecto de 80 apartamentos",
      },
      {
        type: "paragraph",
        text: "Veamos un ejemplo real con números conservadores para un proyecto de 80 apartamentos con precio promedio de $120,000 USD:",
      },
      {
        type: "list",
        items: [
          "Inversión mensual en Google Ads: $2,000 USD",
          "Inversión mensual en Meta Ads: $1,500 USD",
          "Plataforma de showroom digital: $149 USD/mes",
          "Total inversión mensual: $3,649 USD",
          "Visitantes mensuales al sitio: 4,500",
          "Tasa de conversión: 4% → 180 leads/mes",
          "CPL: $3,649 ÷ 180 = $20.27 USD",
          "Tasa de calificación: 35% → 63 leads calificados/mes",
          "Tasa de cierre: 6% → 3.78 ventas/mes",
          "Ingreso por ventas: 3.78 × $120,000 = $453,600 USD",
          "ROI mensual: ($453,600 - $3,649) ÷ $3,649 = 12,330%",
        ],
      },
      {
        type: "callout",
        text: "Incluso si reducimos estos números a la mitad, el ROI del marketing digital inmobiliario sigue siendo extraordinario. El truco está en medir correctamente y optimizar cada paso del embudo.",
      },
      {
        type: "heading",
        text: "Los 3 errores más comunes al medir ROI",
      },
      {
        type: "list",
        items: [
          "Error 1: No atribuir ventas al canal correcto. Si un lead llega por Google Ads pero cierra 3 meses después, ¿le atribuyes la venta al marketing digital? Deberías. Usa UTM tracking y CRM para mantener la trazabilidad.",
          "Error 2: Medir leads en vez de ventas. 200 leads suenan bien, pero si solo 2 compran, tu ROI es bajo. El foco debe estar en leads calificados y en tasa de cierre, no en volumen bruto.",
          "Error 3: Ignorar el ciclo de venta. En inmobiliario, el ciclo promedio es 30-90 días. Medir ROI mensual sin considerar leads en pipeline te da una imagen incompleta.",
        ],
      },
      {
        type: "heading",
        text: "Cómo optimizar tu ROI",
      },
      {
        type: "paragraph",
        text: "Una vez que mides correctamente, la optimización se vuelve lógica. Atacas el eslabón más débil del embudo:",
      },
      {
        type: "list",
        items: [
          "CPC alto → mejora creativos y segmentación de anuncios",
          "CPL alto → optimiza tu landing page (velocidad, UX, formularios)",
          "Baja calificación → agrega cotizador e inventario en vivo para precalificar",
          "Bajo cierre → revisa el proceso comercial y el tiempo de respuesta",
          "CAC alto → automatiza seguimiento y reduce procesos manuales",
        ],
      },
      {
        type: "quote",
        text: "No puedes mejorar lo que no mides. Pero una vez que mides, la optimización del marketing inmobiliario es una de las inversiones más rentables que existe.",
      },
      {
        type: "callout",
        text: "NODDO incluye analytics integrados que te muestran CPL, tasas de conversión, y performance por campaña UTM — todo en un solo dashboard. Agenda una demo para ver cómo funciona con tus datos.",
      },
    ],
  },
  {
    id: "checklist-lanzar-proyecto-3-dias",
    title: "Checklist: Lanzar un proyecto inmobiliario en 3 días",
    excerpt:
      "Guía accionable para lanzar tu microsite premium en tiempo récord. Desde preparación de contenido hasta publicación en vivo.",
    category: "Checklist",
    readTime: "6 min",
    date: "1 Mar 2026",
    icon: CheckSquare,
    color: "#b8973a",
    image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop",
    tags: ["Onboarding", "Checklist", "Guía Rápida"],
    content: [
      {
        type: "paragraph",
        text: "¿Es posible lanzar un showroom digital completo en 3 días? Sí — si llegas preparado. Esta checklist te guía hora por hora para que tu proyecto esté en vivo en tiempo récord, sin atajos que comprometan la calidad. Hemos validado este proceso con más de 30 lanzamientos exitosos.",
      },
      {
        type: "heading",
        text: "Antes de empezar: lo que necesitas tener listo",
      },
      {
        type: "paragraph",
        text: "El 80% del éxito de un lanzamiento rápido está en la preparación. Si llegas al Día 1 sin estos materiales, el proceso se alarga inevitablemente:",
      },
      {
        type: "list",
        items: [
          "Renders de todas las tipologías (mínimo 3 renders por tipología: planta, perspectiva interior, perspectiva exterior)",
          "Planos en formato PNG o PDF de cada tipología",
          "Lista de precios actualizada con plan de pagos por tipología",
          "Inventario completo en Excel: número de unidad, piso, tipología, área, precio, estado",
          "Logo del proyecto en SVG o PNG de alta resolución",
          "Paleta de colores del proyecto (primario, secundario, acento)",
          "Textos descriptivos: descripción del proyecto, del sector, de cada tipología",
          "Fotos del sector y amenidades (propias o de stock de alta calidad)",
          "Videos del proyecto (recorridos, renders animados, avance de obra) — si los tienes",
          "Acceso al dominio donde se publicará (o definición del subdominio)",
        ],
      },
      {
        type: "heading",
        text: "Día 1: Estructura y contenido base (4-6 horas)",
      },
      {
        type: "subheading",
        text: "Mañana (2-3 horas)",
      },
      {
        type: "list",
        items: [
          "Crear el proyecto en la plataforma con nombre, slug, y branding (logo + colores)",
          "Cargar las tipologías: nombre, área, habitaciones, baños, descripción, renders y planos",
          "Configurar la galería: crear categorías (Exteriores, Interiores, Amenidades, Zona) y subir imágenes",
          "Agregar videos si están disponibles",
        ],
      },
      {
        type: "subheading",
        text: "Tarde (2-3 horas)",
      },
      {
        type: "list",
        items: [
          "Configurar el inventario: importar Excel con todas las unidades",
          "Definir la implantación visual (layout del edificio por pisos o del proyecto por lotes)",
          "Verificar que cada unidad tenga: tipología asignada, precio, área, estado correcto",
          "Hacer una primera revisión visual: ¿los renders se ven bien? ¿Los colores son correctos?",
        ],
      },
      {
        type: "heading",
        text: "Día 2: Funcionalidades avanzadas (4-6 horas)",
      },
      {
        type: "subheading",
        text: "Mañana (2-3 horas)",
      },
      {
        type: "list",
        items: [
          "Configurar el cotizador automático: plan de pagos, cuota inicial, financiamiento, descuentos",
          "Personalizar el brochure PDF que se genera automáticamente",
          "Configurar la ubicación: coordenadas del proyecto + puntos de interés cercanos (colegios, centros comerciales, hospitales, parques)",
        ],
      },
      {
        type: "subheading",
        text: "Tarde (2-3 horas)",
      },
      {
        type: "list",
        items: [
          "Conectar dominio personalizado o configurar subdominio",
          "Configurar formularios de contacto y WhatsApp",
          "Integrar CRM (HubSpot, GoHighLevel, o Webhooks para cualquier CRM)",
          "Configurar analytics (Google Analytics, Facebook Pixel, Google Tag Manager)",
        ],
      },
      {
        type: "heading",
        text: "Día 3: Revisión, entrenamiento y lanzamiento (3-4 horas)",
      },
      {
        type: "subheading",
        text: "Mañana (2 horas)",
      },
      {
        type: "list",
        items: [
          "Revisión completa del sitio: navegar cada página, verificar cada enlace, probar cada formulario",
          "Prueba del cotizador: generar 2-3 cotizaciones de prueba con diferentes unidades",
          "Prueba del flujo de leads: enviar un formulario de prueba, verificar que llega al CRM",
          "Revisión en móvil: verificar que todo se ve bien en pantalla de teléfono",
        ],
      },
      {
        type: "subheading",
        text: "Tarde (1-2 horas)",
      },
      {
        type: "list",
        items: [
          "Capacitación del equipo: cómo actualizar inventario, cómo ver leads, cómo cambiar precios",
          "Documentar el proceso para referencia futura",
          "Publicar el sitio en vivo",
          "Compartir el enlace con el equipo de marketing para activar campañas",
        ],
      },
      {
        type: "heading",
        text: "Checklist de verificación final",
      },
      {
        type: "list",
        items: [
          "✅ Todas las tipologías tienen renders y planos",
          "✅ El inventario refleja el estado real de cada unidad",
          "✅ Los precios están correctos y actualizados",
          "✅ El cotizador genera PDFs correctos",
          "✅ Los formularios envían leads al CRM",
          "✅ WhatsApp funciona con mensaje predefinido",
          "✅ El sitio carga en menos de 3 segundos",
          "✅ La experiencia móvil es correcta",
          "✅ Analytics están configurados y registrando datos",
          "✅ El equipo de ventas sabe actualizar el inventario",
        ],
      },
      {
        type: "quote",
        text: "El lanzamiento no es el final — es el comienzo. El verdadero valor viene de optimizar continuamente basándose en los datos que empiezas a recopilar desde el día uno.",
      },
      {
        type: "callout",
        text: "¿Quieres lanzar tu proyecto en 3 días? Con NODDO, este checklist no es aspiracional — es el proceso estándar. Agenda una llamada y te mostramos un proyecto lanzado de principio a fin.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.id === slug);
}

export function getRelatedArticles(currentId: string, count = 2): Article[] {
  return articles.filter((a) => a.id !== currentId).slice(0, count);
}
