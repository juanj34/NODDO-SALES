const tooltips = {
  /* ═══════════════════════════════════════════════════════════════════
     General — Sub-tabs: proyecto, inicio, constructora, diseño, avanzado
     ═══════════════════════════════════════════════════════════════════ */
  general: {
    renderPrincipal: {
      short: "Imagen principal que aparece como fondo del hero en la landing.",
      long: "Sube un **render de alta calidad** (idealmente 1920×1080 o superior). Esta imagen ocupa toda la pantalla como primer impacto visual del micrositio. Se recomienda formato **16:9** en horizontal.",
    },
    logo: {
      short: "Logo del proyecto que aparece centrado sobre el hero.",
      long: "Sube el logo en formato **PNG con fondo transparente** para mejor resultado. El tamaño visible se puede ajustar con el control deslizante de altura. Se recomienda un logo horizontal (landscape).",
    },
    logoHeight: {
      short: "Controla el tamaño del logo sobre el hero del micrositio.",
      long: "Ajusta la **altura en píxeles** del logo. El valor por defecto es 96px. Un logo más grande genera mayor presencia visual, pero asegúrate de que no tape demasiado el render de fondo.",
    },
    heroVideo: {
      short: "Video corto que reemplaza la imagen de fondo del hero.",
      long: "Si subes un video, este reemplazará al render principal como fondo del hero. Usa un video **corto (10–30 seg), en loop, sin sonido**, en formato MP4 o WebM. Se reproduce automáticamente en silencio.",
    },
    descripcion: {
      short: "Texto descriptivo del proyecto visible en la landing del micrositio.",
      long: "Esta descripción aparece debajo del hero. Usa un tono **aspiracional pero informativo**: ubicación, estilo de vida, amenidades destacadas. Máximo 5000 caracteres. Soporta mejora con IA.",
    },
    favicon: {
      short: "Icono pequeño que aparece en la pestaña del navegador.",
      long: "Sube una imagen **cuadrada** (idealmente 32×32 o 512×512 px). Aparece en la pestaña del navegador, en marcadores y en resultados de búsqueda. Formatos recomendados: PNG, SVG o ICO.",
    },
    ogImage: {
      short: "Imagen de preview cuando se comparte el link en redes sociales.",
      long: "La imagen **Open Graph** aparece cuando alguien comparte el link del micrositio en WhatsApp, Facebook, LinkedIn, etc. Tamaño ideal: **1200×630 px**. Si no la configuras, se usa el render principal.",
    },
    backgroundAudio: {
      short: "Música de fondo ambiental para el micrositio.",
      long: "Sube un archivo de audio (MP3, WAV, OGG) que se reproducirá como **música de fondo** al navegar el micrositio. El visitante puede pausarlo. Úsalo para crear atmósfera — algo sutil y elegante.",
    },
    colorPrimario: {
      short: "Color de acento principal del micrositio.",
      long: "Este color se aplica a **botones, enlaces, bordes destacados y elementos de acento** en todo el micrositio. Elige un color que represente la identidad del proyecto. Se puede restablecer al gold por defecto.",
    },
    temaModo: {
      short: "Selecciona el modo visual del micrositio: oscuro o claro.",
      long: "El modo **oscuro** (por defecto) ofrece un look premium y luxury. El modo **claro** usa fondos luminosos para un look más abierto y moderno. Todos los colores de texto y superficies se adaptan automáticamente.",
    },
    disclaimer: {
      short: "Texto legal que aparece en el footer del micrositio.",
      long: "Agrega disclaimers, avisos legales o textos normativos. Este texto se muestra al final de cada página del micrositio en tipografía pequeña. Ejemplo: *Las imágenes son ilustrativas y pueden no representar el producto final.*",
    },
    privacyPolicy: {
      short: "URL a tu página de política de tratamiento de datos.",
      long: "Ingresa la URL completa (https://...) a tu **política de privacidad**. Aparecerá como enlace en el footer y en el formulario de contacto para cumplir con regulaciones de protección de datos.",
    },
    idioma: {
      short: "Idioma en el que se muestra el micrositio a los visitantes.",
      long: "Selecciona entre **Español** e **Inglés**. Esto afecta todos los textos de la interfaz del micrositio (botones, labels, mensajes). El contenido que ingresas en el editor (descripción, nombres) se muestra tal cual.",
    },
    estadoConstruccion: {
      short: "Estado actual de la obra, visible en cotizaciones PDF.",
      long: "**Sobre planos:** El proyecto aún no inicia construcción. **En construcción:** La obra está en progreso. **Entregado:** Las unidades están listas para entrega. Este estado aparece en el PDF de cotización.",
    },
    politicaAmoblado: {
      short: "Define si las unidades incluyen amoblado o es opcional.",
      long: "**No aplica:** No se muestra info de amoblado. **Incluido:** Todas las unidades vienen amobladas (se muestra en el PDF). **Opcional:** El agente puede activar/desactivar amoblado al generar cada cotización individual.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Config — Sub-tabs: general, tipologias, inventario, micrositio, etc.
     ═══════════════════════════════════════════════════════════════════ */
  config: {
    slug: {
      short: "Identificador URL único del proyecto en NODDO.",
      long: "El slug define la URL del micrositio: **noddo.io/sites/{slug}**. Solo acepta letras minúsculas, números y guiones. Una vez publicado, cambiar el slug rompe los links existentes.",
    },
    tipoProyecto: {
      short: "Define el tipo de unidades inmobiliarias del proyecto.",
      long: "**Apartamentos:** Unidades en torres con pisos. **Casas:** Unidades independientes con lotes. **Híbrido:** Mezcla de tipos. **Lotes:** Solo terrenos. Esta selección afecta qué campos aparecen en tipologías e inventario.",
    },
    tipologiaMode: {
      short: "Controla cómo se asignan tipologías a las unidades.",
      long: "**Fija:** Cada unidad tiene una sola tipología. **Múltiple:** Una unidad puede pertenecer a varias tipologías (ej. un apto que se ofrece en versiones 2 y 3 alcobas). El modo múltiple es más flexible pero requiere más configuración.",
    },
    precioSource: {
      short: "Define de dónde se toma el precio mostrado al público.",
      long: "**Desde unidad:** Cada unidad tiene su propio precio individual. **Desde tipología:** Se usa el precio base de la tipología para todas las unidades del mismo tipo. Útil cuando todas las unidades del mismo tipo cuestan igual.",
    },
    etapaLabel: {
      short: "Nombre de la agrupación visual en el grid interactivo.",
      long: "Define cómo se agrupan las fachadas en el micrositio: **Grid**, **Etapa**, **Sector**, **Manzana**, **Zona**, o **Bloque**. Usa el término que mejor describa la organización física de tu proyecto.",
    },
    unitPrefix: {
      short: "Prefijo que se antepone al identificador de cada unidad.",
      long: "Se muestra antes del número de unidad en todo el sistema. Ejemplo: si el prefijo es **Apto** y la unidad es **301**, se muestra como **Apto 301**. Déjalo vacío si no necesitas prefijo.",
    },
    whatsapp: {
      short: "Número de WhatsApp del botón flotante del micrositio.",
      long: "Ingresa el número con **código de país sin +** (ej. 573001234567). Este número se usa en el botón flotante de WhatsApp que aparece en todo el micrositio. Es el canal de contacto principal para los compradores.",
    },
    seccionesVisibles: {
      short: "Controla qué secciones del micrositio están visibles.",
      long: "Activa o desactiva cada sección del micrositio. Las secciones desactivadas **no aparecen** en la navegación ni son accesibles. Útil para ocultar secciones que aún no tienen contenido o que no aplican al proyecto.",
    },
    agentMode: {
      short: "Modo especial para agentes inmobiliarios con restricciones.",
      long: "Cuando está activado, los **agentes externos** ven una versión limitada del micrositio según la configuración: sin precios, sin unidades vendidas, sin cotizador, etc. Útil para controlar qué información comparten los agentes con los clientes.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Torres
     ═══════════════════════════════════════════════════════════════════ */
  torres: {
    concepto: {
      short: "Las torres organizan tu proyecto en edificaciones o bloques.",
      long: "Cada **torre** agrupa unidades, fachadas y galerías. Un proyecto puede tener una o varias torres. Las unidades, fachadas y categorías de galería se pueden asociar a torres específicas para organizar mejor el contenido.",
    },
    nombre: {
      short: "Nombre visible de la torre en el micrositio e inventario.",
      long: "Usa un nombre descriptivo como **Torre Norte**, **Bloque A**, **Etapa 1**, etc. Este nombre aparece en los filtros del micrositio y en las cotizaciones PDF.",
    },
    descripcion: {
      short: "Texto descriptivo de la torre visible en el micrositio.",
      long: "Describe las características únicas de esta torre: número de pisos, vista, acabados, amenidades exclusivas. Soporta mejora con IA para lograr un tono más profesional.",
    },
    amenidades: {
      short: "Lista de amenidades y áreas comunes de esta torre.",
      long: "Ingresa las amenidades separadas por coma. Ejemplo: **Piscina, Gimnasio, Salón social, Zona BBQ**. Estas aparecen como etiquetas en el detalle de la torre en el micrositio.",
    },
    imagenUrl: {
      short: "Imagen representativa de la torre para el micrositio.",
      long: "Sube un render o foto que represente esta torre. Aparece como **imagen destacada** en la sección de torres del micrositio. Tamaño recomendado: 1200×800 px o superior.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Tipologías
     ═══════════════════════════════════════════════════════════════════ */
  tipologias: {
    concepto: {
      short: "Las tipologías definen los tipos de unidad del proyecto.",
      long: "Una **tipología** es un modelo de unidad inmobiliaria (ej. Apto 2 Alcobas, Casa Esquinera, Lote 200m²). Define las características base (área, habitaciones, precio desde) que comparten todas las unidades de ese tipo.",
    },
    tipoTipologia: {
      short: "Clasifica la tipología según el tipo de inmueble.",
      long: "Las opciones dependen del **tipo de proyecto**: apartamento, casa, lote, penthouse, estudio, local, oficina, bodega. Esta clasificación afecta qué campos y columnas de inventario se muestran para las unidades de esta tipología.",
    },
    renders: {
      short: "Imágenes de renders que muestran cómo se ve esta tipología.",
      long: "Sube múltiples renders de la tipología. Estos se muestran en el **slider de tipologías** del micrositio como imágenes de fondo a pantalla completa. Se recomienda formato horizontal 16:9 en alta resolución.",
    },
    plano: {
      short: "Plano arquitectónico de la tipología.",
      long: "Sube el plano de distribución (planta) de esta tipología. Aparece en el panel de detalle al seleccionar la tipología en el micrositio. Formatos aceptados: PNG, JPG, PDF. Fondo blanco o transparente recomendado.",
    },
    ubicacionPlano: {
      short: "Imagen de ubicación de la tipología en el edificio.",
      long: "Sube una imagen que muestre **dónde se ubica** esta tipología dentro de la torre o el proyecto. Puede ser un plano de planta marcando la posición, o un render con la unidad resaltada.",
    },
    hotspots: {
      short: "Puntos interactivos sobre el plano de la tipología.",
      long: "Los **hotspots** son áreas clicables que se colocan sobre el plano. Cada uno tiene un nombre y descripción. Úsalos para resaltar espacios como sala, alcoba principal, balcón, etc.",
    },
    pisos: {
      short: "Configuración de pisos específicos con renders diferentes.",
      long: "Si la tipología tiene variaciones por piso (ej. piso 1 tiene patio, último piso tiene terraza), puedes definir **pisos individuales** con renders y planos distintos. Cada piso puede tener su propia imagen representativa.",
    },
    caracteristicas: {
      short: "Lista de características y acabados de la tipología.",
      long: "Agrega tags con las características de esta tipología: acabados, equipamiento, beneficios. Ejemplo: **Cocina integral, Piso en porcelanato, Closets empotrados**. Aparecen como etiquetas en el micrositio.",
    },
    torreAsignacion: {
      short: "Torres en las que está disponible esta tipología.",
      long: "Selecciona en qué **torres** se ofrece esta tipología. Si el proyecto tiene una sola torre, se asigna automáticamente. Si tiene varias, puedes ofrecer la misma tipología en múltiples torres.",
    },
    extras: {
      short: "Características especiales adicionales de la tipología.",
      long: "Activa extras como **jacuzzi, piscina privada, BBQ, terraza, jardín, estudio**, etc. Estos extras solo aparecen si están habilitados a nivel de proyecto en Configuración > Tipologías. Se muestran como iconos en el micrositio.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Inventario
     ═══════════════════════════════════════════════════════════════════ */
  inventario: {
    concepto: {
      short: "El inventario contiene todas las unidades individuales del proyecto.",
      long: "Cada **unidad** es un inmueble específico (ej. Apto 301, Casa 15, Lote 8B). Las unidades heredan características de su tipología pero pueden tener valores propios de área, precio y estado. El inventario alimenta el micrositio, las cotizaciones y el seguimiento de ventas.",
    },
    estado: {
      short: "Estado de disponibilidad de la unidad.",
      long: "**Disponible:** A la venta. **Próximamente:** Aún no se comercializa. **Separado:** Tiene interesado pero no está vendida. **Reservada:** Compromiso formal de compra. **Vendida:** Transacción cerrada. El estado controla qué unidades se muestran y cómo en el micrositio.",
    },
    identificador: {
      short: "Código o número único de la unidad dentro del proyecto.",
      long: "Este es el identificador visible (ej. **301**, **Casa 15**, **L-08**). Debe ser único por proyecto. Se muestra en el micrositio, cotizaciones y reportes. Combinado con el prefijo de unidad, forma el nombre completo.",
    },
    orientacion: {
      short: "Dirección cardinal hacia donde mira la unidad.",
      long: "Indica la orientación principal de la unidad: Norte, Sur, Este, Oeste o intermedias. Afecta la iluminación natural y es un factor de decisión para los compradores. Se muestra como filtro en el micrositio.",
    },
    vista: {
      short: "Tipo de vista que tiene la unidad.",
      long: "Describe qué se ve desde la unidad (ej. **Vista al mar**, **Vista a la ciudad**, **Interior**). Las vistas se configuran en la pestaña de Vistas y se asignan aquí. Es un factor de valorización importante.",
    },
    smartImport: {
      short: "Importa masivamente unidades desde un archivo Excel o CSV.",
      long: "La **importación inteligente** lee tu archivo y mapea las columnas automáticamente. Soporta Excel (.xlsx) y CSV. Ideal para cargar el inventario inicial de forma masiva sin ingresar unidad por unidad.",
    },
    complementos: {
      short: "Parqueaderos y depósitos asignables a las unidades.",
      long: "Los **complementos** son items adicionales (parqueaderos, depósitos, bodegas) que se pueden vender junto con las unidades. Configura el modo: **incluido** (viene con la unidad), **pool** (se asignan por separado) o **deshabilitado**.",
    },
    precioVenta: {
      short: "Precio final de venta diferente al precio de lista.",
      long: "Si la unidad se vendió a un precio diferente al de lista (descuento, negociación), ingresa aquí el **precio real de cierre**. Útil para reportes y análisis de ventas vs. precio de lista.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Galería
     ═══════════════════════════════════════════════════════════════════ */
  galeria: {
    concepto: {
      short: "Organiza las fotos y renders del proyecto en categorías.",
      long: "La galería del micrositio se organiza en **categorías** (ej. Exteriores, Interiores, Amenidades, Acabados). Cada categoría puede ser general (todo el proyecto) o asociada a una torre. Las imágenes dentro de cada categoría se pueden reordenar arrastrándolas.",
    },
    categoria: {
      short: "Agrupación temática de imágenes dentro de la galería.",
      long: "Crea categorías que representen las secciones de tu galería. Ejemplo: **Renders exteriores**, **Áreas comunes**, **Acabados cocina**. Las categorías aparecen como tabs en el micrositio. Se pueden reordenar arrastrando.",
    },
    torreScope: {
      short: "Asocia una categoría de galería a una torre específica.",
      long: "Si el proyecto tiene varias torres, puedes crear galerías **específicas por torre**. Las categorías sin torre asignada son generales y aparecen para todo el proyecto. El filtro de torre permite a los visitantes ver solo las imágenes relevantes.",
    },
    altText: {
      short: "Título descriptivo de la imagen (accesibilidad + SEO).",
      long: "Agrega un título a cada imagen. Se usa como **texto alternativo** para accesibilidad y como caption visible al abrir el lightbox. También mejora el SEO de las imágenes del micrositio.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Videos
     ═══════════════════════════════════════════════════════════════════ */
  videos: {
    concepto: {
      short: "Videos del proyecto: YouTube o subida directa con streaming.",
      long: "Agrega videos al micrositio de dos formas: pegando una **URL de YouTube** o subiendo un archivo de video directamente. Los videos subidos se procesan en la nube con streaming adaptativo para la mejor calidad posible.",
    },
    youtubeUrl: {
      short: "Pega la URL completa de un video de YouTube.",
      long: "Acepta URLs en formato `youtube.com/watch?v=...` o `youtu.be/...`. El thumbnail se extrae automáticamente. El video se reproduce embebido dentro del micrositio sin salir de la página.",
    },
    upload: {
      short: "Sube un archivo de video para hosting con streaming.",
      long: "Sube archivos MP4, MOV, WebM o MKV. El video se procesa en la nube con **streaming adaptativo** (HLS), lo que significa que la calidad se ajusta automáticamente a la velocidad de internet del visitante. El procesamiento puede tomar unos minutos.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Tour 360
     ═══════════════════════════════════════════════════════════════════ */
  tour: {
    concepto: {
      short: "Tour virtual 360° del proyecto o de tipologías individuales.",
      long: "Puedes agregar tours 360° de dos formas: pegando una **URL externa** (Matterport, Kuula, etc.) o subiendo los archivos del tour directamente a NODDO. Los tours se muestran como iframe a pantalla completa en el micrositio.",
    },
    urlExterna: {
      short: "URL de un tour alojado en plataforma externa.",
      long: "Pega la URL o el código de embed de plataformas como **Matterport, Kuula, CloudPano**, etc. NODDO extrae automáticamente la URL correcta del iframe. El tour se embebe directamente en el micrositio.",
    },
    uploadZip: {
      short: "Sube un tour 360° empaquetado como ZIP o carpeta.",
      long: "Sube un archivo **.zip** o arrastra la **carpeta completa** del tour exportado. NODDO sube todos los archivos al CDN y genera una URL de hosting propia. Ideal para tours exportados de herramientas como 3DVista, Pano2VR o Krpano.",
    },
    tipologiaTour: {
      short: "Tour individual para una tipología específica.",
      long: "Además del tour general del proyecto, puedes asignar un tour 360° a cada tipología. Útil cuando cada tipo de unidad tiene su propio recorrido virtual. Se accede desde la ficha de la tipología en el micrositio.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Ubicación
     ═══════════════════════════════════════════════════════════════════ */
  ubicacion: {
    coordenadas: {
      short: "Latitud y longitud del proyecto para el mapa interactivo.",
      long: "Ingresa las coordenadas exactas del proyecto. Puedes hacerlo manualmente o usar el **selector de mapa**. Estas coordenadas centran el mapa satelital interactivo del micrositio y permiten calcular distancias a los puntos de interés.",
    },
    direccion: {
      short: "Dirección física del proyecto visible en el micrositio.",
      long: "Ingresa la dirección completa (calle, número, barrio, ciudad). Se muestra como texto en la sección de ubicación del micrositio junto al mapa interactivo.",
    },
    poi: {
      short: "Puntos de interés cercanos al proyecto.",
      long: "Los **POIs** (Points of Interest) son lugares relevantes cerca del proyecto: centros comerciales, hospitales, colegios, estaciones de transporte, restaurantes. Aparecen como marcadores en el mapa interactivo del micrositio con información de distancia y tiempo de llegada.",
    },
    poiCategoria: {
      short: "Categoría del punto de interés para filtrado en el mapa.",
      long: "Las categorías disponibles son: **Comercio, Recreación, Salud, Educación, Transporte, Gastronomía, Cultura y Deporte**. Los visitantes del micrositio pueden filtrar los POIs por categoría en el mapa interactivo.",
    },
    poiDistancia: {
      short: "Distancia en kilómetros desde el proyecto hasta el POI.",
      long: "Se calcula automáticamente si tienes coordenadas del proyecto y del POI. También puedes ingresarla manualmente. Se muestra en la tarjeta del POI en el micrositio (ej. **1.2 km**).",
    },
    poiTiempo: {
      short: "Tiempo estimado de viaje desde el proyecto al POI.",
      long: "Tiempo en minutos de viaje (en carro o caminando, según la distancia). Se muestra junto a la distancia en el micrositio. Ejemplo: **5 min** en carro. Puedes ingresarlo manualmente o usar la sugerencia automática.",
    },
    aiDiscovery: {
      short: "Descubrimiento automático de POIs con inteligencia artificial.",
      long: "La IA busca automáticamente lugares relevantes cerca de las coordenadas del proyecto. Puedes seleccionar las categorías y el radio de búsqueda. Los POIs sugeridos se pueden agregar con un clic.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Vistas
     ═══════════════════════════════════════════════════════════════════ */
  vistas: {
    concepto: {
      short: "Define las vistas disponibles desde el proyecto y sus características.",
      long: "Las **vistas** describen qué panorama se ve desde diferentes unidades del proyecto: vista al mar, a la montaña, a la ciudad, interior, etc. Cada vista puede tener una orientación, rango de pisos, imagen representativa y tipologías asociadas.",
    },
    orientacion: {
      short: "Dirección cardinal de la vista.",
      long: "Indica hacia qué punto cardinal mira esta vista: **Norte, Sur, Este, Oeste** o combinaciones. Esto ayuda a los compradores a entender la iluminación natural y el panorama según la hora del día.",
    },
    pisoRango: {
      short: "Rango de pisos desde donde se aprecia esta vista.",
      long: "Define el piso mínimo y máximo desde donde se puede apreciar esta vista. Ejemplo: la vista al mar puede estar disponible **desde el piso 8**. Esto ayuda a filtrar qué unidades tienen acceso a cada vista.",
    },
    imagen: {
      short: "Foto o render de lo que se ve desde esta vista.",
      long: "Sube una imagen que represente el panorama real de esta vista. Aparece en el micrositio cuando el visitante selecciona una vista. Usa una **foto real** o un **render panorámico** de alta calidad.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Fachadas (NODDO Grid)
     ═══════════════════════════════════════════════════════════════════ */
  fachadas: {
    hotspotEditor: {
      short: "Crea puntos interactivos en la fachada del proyecto.",
      long: "Los **hotspots** son áreas clicables sobre la imagen de la fachada. Úsalos para destacar acabados, áreas comunes, vistas, o cualquier detalle arquitectónico que quieras resaltar a los compradores.",
    },
    concepto: {
      short: "El Grid NODDO es el sistema interactivo de fachadas del micrositio.",
      long: "Las **fachadas** son imágenes de los edificios o manzanas sobre las cuales se colocan puntos interactivos (hotspots) que representan las unidades. Los visitantes hacen clic en un hotspot para ver la ficha de la unidad, sus características y generar una cotización.",
    },
    implantacion: {
      short: "Plano general que muestra la distribución del proyecto.",
      long: "La **implantación** es el plano maestro (site plan) que muestra todas las torres o manzanas del proyecto desde arriba. Los hotspots sobre la implantación llevan a las fachadas individuales de cada torre o bloque.",
    },
    fachada: {
      short: "Imagen frontal de una torre o bloque para hotspots de unidades.",
      long: "Sube un **render o foto de la fachada** de la torre. Sobre esta imagen se colocan los hotspots que representan cada unidad. Los visitantes hacen clic en un hotspot para ver precio, área, estado y generar cotización.",
    },
    planta: {
      short: "Vista de planta de un piso para ubicar unidades.",
      long: "La vista de **planta** (floor plan) muestra la distribución de un piso desde arriba. Los hotspots sobre la planta permiten localizar cada unidad dentro del piso. Es complementaria a la vista de fachada.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Recursos
     ═══════════════════════════════════════════════════════════════════ */
  recursos: {
    concepto: {
      short: "Documentos descargables del proyecto para los visitantes.",
      long: "Los **recursos** son archivos PDF u otros documentos que los visitantes del micrositio pueden descargar: brochures, fichas técnicas, lista de acabados, planos, lista de precios, etc. Se organizan por tipo y aparecen en la sección de recursos del micrositio.",
    },
    tipo: {
      short: "Categoría del recurso para organización y visualización.",
      long: "Selecciona el tipo de documento: **Brochure, Ficha técnica, Acabados, Precios, Planos, Render, Manual, Reglamento, Garantías** u **Otro**. El tipo determina el icono que se muestra y ayuda a los visitantes a encontrar lo que buscan.",
    },
    brochureUrl: {
      short: "URL del brochure principal del proyecto.",
      long: "Si configuras un recurso tipo **Brochure**, este se destaca como el recurso principal del proyecto. Puedes subir un PDF directamente o pegar la URL de un archivo ya alojado. Se muestra como botón destacado en el micrositio.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Avances de Obra
     ═══════════════════════════════════════════════════════════════════ */
  avances: {
    concepto: {
      short: "Reportes periódicos del progreso de la construcción.",
      long: "Los **avances de obra** son actualizaciones que informan a los compradores sobre el progreso de la construcción. Cada avance tiene fecha, título, descripción con formato rico, imagen y video opcional. Se muestran en orden cronológico en el micrositio.",
    },
    estado: {
      short: "Controla si el avance es visible en el micrositio.",
      long: "**Publicado:** Visible para todos los visitantes del micrositio. **Borrador:** Solo visible en el editor, no aparece en el micrositio. Usa borrador para preparar avances antes de publicarlos.",
    },
    fecha: {
      short: "Fecha del avance de obra.",
      long: "Selecciona la fecha del reporte de avance. Los avances se **ordenan por fecha** en el micrositio, mostrando el más reciente primero. Usa la fecha real del avance, no la fecha en que lo ingresas al sistema.",
    },
    videoUrl: {
      short: "URL de video del avance (YouTube o similar).",
      long: "Si tienes un video del avance de obra, pega la URL de **YouTube**. El video se embebe junto a la imagen y descripción del avance. Ideal para mostrar recorridos por la obra en progreso.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Cotizador (existentes — preservados sin cambios)
     ═══════════════════════════════════════════════════════════════════ */
  cotizador: {
    tipoFase: {
      short: "Define cómo se calcula el monto de esta fase del plan de pagos.",
      long: "**Fijo:** Ingresa un monto específico (ej. $5,000,000). **Porcentaje:** Define un % del precio total de la unidad. **Resto:** Calcula automáticamente lo que falta por pagar después de las otras fases.",
    },
    separacionIncluida: {
      short: "Controla si la separación se descuenta de la cuota inicial o se suma al total.",
      long: "Si está **activado**, el monto de separación se descuenta automáticamente de la cuota inicial. Si está **desactivado**, la separación se suma como un pago adicional al plan.",
    },
    notasLegales: {
      short: "Texto legal que aparece al final del PDF de cotización.",
      long: "Usa este campo para agregar disclaimers, términos y condiciones, o cualquier nota legal que deba aparecer en todas las cotizaciones. Ejemplo: *Precios sujetos a cambio sin previo aviso*.",
    },
    moneda: {
      short: "Define la moneda para todas las cotizaciones del proyecto.",
      long: "Esta moneda se usará para formatear precios en el PDF y en el micrositio. No afecta la base de datos, solo la visualización.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Webhooks (existentes — preservados sin cambios)
     ═══════════════════════════════════════════════════════════════════ */
  webhooks: {
    secretFirma: {
      short: "Clave secreta para verificar que los webhooks vienen de NODDO.",
      long: "Usa este secret en tu servidor para validar la firma HMAC-SHA256 del header `X-Webhook-Signature`. Así garantizas que el webhook no fue falsificado. [Ver documentación](#).",
    },
    urlWebhook: {
      short: "URL de tu servidor que recibirá los eventos vía POST.",
      long: "Debe ser **HTTPS** y estar accesible públicamente. NODDO enviará un POST con JSON cada vez que ocurra un evento seleccionado (ej. lead creado, cotización generada).",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Dominio (existentes — preservados sin cambios)
     ═══════════════════════════════════════════════════════════════════ */
  dominio: {
    dnsRecords: {
      short: "Configura un registro CNAME en tu proveedor de dominios.",
      long: "Crea un registro **CNAME** apuntando tu dominio (o subdominio) a `noddo.io`. La verificación puede tardar hasta 48 horas. Una vez validado, tu micrositio estará disponible en tu dominio personalizado.",
    },
  },
};

export default tooltips;
