const help = {
  page: {
    title: "Centro de Ayuda",
    description:
      "Todo lo que necesitas saber para crear y gestionar tu micrositio inmobiliario",
    heroSubtitle:
      "Guías paso a paso para cada función de NODDO. Encuentra respuestas, aprende trucos y domina la plataforma.",
    searchPlaceholder: "Buscar en la ayuda...",
    noResults: "No se encontraron resultados. Intenta con otros términos.",
    ctaTitle: "¿No encontraste lo que buscabas?",
    ctaDescription:
      "Nuestro equipo de soporte está listo para ayudarte con cualquier duda sobre la plataforma.",
    ctaContact: "Contáctanos",
    ctaWhatsapp: "Escribir por WhatsApp",
    stepsLabel: "Paso a paso",
    tipsLabel: "Consejos",
    articlesCount: "{{count}} artículos",
  },
  categories: {
    dashboard: "Panel de Control",
    proyecto: "Proyecto",
    contenido: "Contenido",
    ajustes: "Ajustes",
    flujos: "Flujos de Trabajo",
  },
  categoryDescriptions: {
    dashboard:
      "Proyectos, equipo, leads, disponibilidad y estadísticas",
    proyecto:
      "Configuración general, torres y urbanismos",
    contenido:
      "Tipologías, inventario, galería, videos, ubicación y más",
    ajustes:
      "Configuración, dominio personalizado y webhooks",
    flujos:
      "Publicación, auto-guardado, IA y archivos",
  },
  articles: {
    /* ────────────────────────────────────────────
       PANEL DE CONTROL
    ──────────────────────────────────────────── */
    proyectos: {
      title: "Gestionar Proyectos",
      description:
        "Crea, edita, elimina y administra tus micrositios inmobiliarios",
      content:
        "Desde el panel de Proyectos puedes ver todos tus micrositios, crear nuevos y acceder al editor de cada uno. Cada proyecto representa un micrositio completo con su propia URL, branding y contenido.",
      steps: [
        "Haz clic en «Nuevo Proyecto» para crear un micrositio manualmente. Ingresa el nombre y opcionalmente un slug personalizado para la URL.",
        "Usa «Crear con IA» para que el asistente pre-llene los datos a partir de texto, brochures o documentos que le proporciones.",
        "Haz clic en «Crear Demo» para generar un proyecto con datos de ejemplo y explorar todas las funciones sin riesgo.",
        "En cada tarjeta de proyecto verás su nombre, constructora, estado (borrador/publicado/archivado) y la URL del micrositio.",
        "Haz clic en «Editar» para abrir el editor completo del proyecto, o en «Ver sitio» para abrir el micrositio publicado.",
        "Para eliminar un proyecto, haz clic en el ícono de eliminar. Deberás escribir el nombre del proyecto para confirmar la acción.",
      ],
      tips: [
        "El slug determina la URL de tu micrositio (ejemplo: mi-proyecto.noddo.io). Elige uno corto y memorable.",
        "Un proyecto en estado «borrador» no es visible al público hasta que lo publiques desde el editor.",
      ],
    },
    equipo: {
      title: "Equipo y Colaboradores",
      description:
        "Invita colaboradores y gestiona los permisos de tu equipo",
      content:
        "La sección de Equipo te permite invitar hasta 3 colaboradores que podrán ayudarte a actualizar el estado de las unidades en el inventario. Los colaboradores no tienen acceso a crear o eliminar proyectos, ni a editar otros contenidos.",
      steps: [
        "Accede a «Equipo» desde la barra lateral del dashboard.",
        "Haz clic en «Invitar colaborador» e ingresa el email de la persona. Opcionalmente agrega su nombre.",
        "El colaborador recibirá un email con un enlace para crear su cuenta y acceder a la plataforma.",
        "Una vez que acepte la invitación, su estado cambiará de «Pendiente» a «Activo».",
        "Puedes suspender temporalmente a un colaborador sin eliminarlo, o reactivarlo cuando lo necesites.",
        "Para eliminar a un colaborador por completo, usa la opción «Eliminar» y confirma la acción.",
      ],
      tips: [
        "Los colaboradores solo pueden cambiar el estado de las unidades (disponible, separado, reservada, vendida). No pueden crear ni eliminar unidades, ni acceder a otros módulos del editor.",
        "El límite máximo es de 3 colaboradores por cuenta de administrador.",
      ],
    },
    leads: {
      title: "Leads y Contactos",
      description:
        "Visualiza y exporta las solicitudes de contacto recibidas",
      content:
        "Cada vez que un visitante llena el formulario de contacto en tu micrositio, se crea un lead que aparece en esta sección. Puedes buscar, filtrar y exportar tus leads para darles seguimiento.",
      steps: [
        "Accede a «Leads» desde la barra lateral. Verás una tabla con todos los contactos recibidos.",
        "Usa la barra de búsqueda para filtrar por nombre o email.",
        "Filtra por tipología de interés usando el selector desplegable.",
        "Haz clic en «Exportar CSV» para descargar todos los leads en formato Excel.",
      ],
      tips: [
        "El archivo CSV incluye: nombre, email, teléfono, país, tipología de interés, mensaje y fecha. Se abre correctamente en Excel con acentos y caracteres especiales.",
        "Los leads capturan automáticamente los parámetros UTM de la URL del visitante, útil para medir campañas de marketing.",
      ],
    },
    disponibilidad: {
      title: "Disponibilidad de Unidades",
      description:
        "Actualiza el estado de las unidades en tiempo real",
      content:
        "La sección de Disponibilidad te permite actualizar el estado de las unidades de tu proyecto (disponible, separado, reservada, vendida) de forma rápida. Los cambios se aplican con actualización optimista — se reflejan al instante sin esperar la respuesta del servidor. Tanto administradores como colaboradores tienen acceso a esta funcionalidad.",
      steps: [
        "Accede a «Disponibilidad» desde la barra lateral del dashboard.",
        "Selecciona el proyecto que deseas gestionar.",
        "Filtra las unidades por torre o tipología usando los selectores en la parte superior.",
        "Haz clic en el badge de estado de cualquier unidad para cambiar su disponibilidad: disponible (verde), separado (amarillo), reservada (azul) o vendida (rojo).",
        "Los precios se muestran en formato completo con separadores de miles (formato COP). El cambio se guarda automáticamente con actualización optimista — ves el resultado al instante.",
        "Puedes ver un resumen con el total de unidades en cada estado en la parte superior de la página.",
      ],
      tips: [
        "Esta es la única función que los colaboradores pueden ejecutar. Es ideal para que tu equipo de ventas mantenga actualizado el inventario sin necesidad de entrar al editor completo.",
        "Las unidades vendidas desaparecen de la visualización pública del micrositio (si está activado «Ocultar vendidas» en Configuración), pero siguen visibles en el editor y en esta sección.",
        "Los cambios de estado se sincronizan en tiempo real — si dos personas están editando al mismo tiempo, verán los cambios de la otra persona inmediatamente.",
        "Los cambios usan actualización optimista: el cambio aparece visualmente al instante y se sincroniza con el servidor en segundo plano. Si falla, se revierte automáticamente.",
      ],
    },
    estadisticas: {
      title: "Estadísticas y Analytics",
      description:
        "Métricas completas de desempeño de tu micrositio",
      content:
        "La pestaña de Estadísticas dentro del editor de cada proyecto te ofrece un panel completo de analytics: vistas, visitantes únicos, conversión de leads, distribución por dispositivos, países, páginas más visitadas y fuentes de tráfico. Puedes seleccionar el rango temporal (7, 30 o 90 días) y exportar los datos a CSV. También puedes ver métricas de almacenamiento del proyecto.",
      steps: [
        "Desde el editor de tu proyecto, haz clic en la pestaña «Estadísticas».",
        "En la parte superior verás 6 KPIs principales: vistas totales, visitantes únicos, total de leads, tasa de conversión, tasa de rebote y páginas por sesión.",
        "Selecciona el rango de tiempo deseado (7d, 30d, 90d) para actualizar todas las métricas.",
        "Revisa los gráficos de evolución temporal de vistas, visitantes y leads.",
        "En la sección de Distribución verás: dispositivos (desktop/mobile/tablet), páginas más visitadas, principales fuentes de tráfico (referrers) y países de origen de los visitantes.",
        "Si tienes unidades con precio configurado, verás métricas financieras: inventario total, valor promedio por unidad, unidades vendidas, valor total vendido y revenue basado en los precios de venta registrados (precio_venta).",
        "Haz clic en «Exportar CSV» para descargar todas las métricas en formato Excel.",
        "En la barra lateral del editor, debajo del menú de navegación, verás un indicador de uso de almacenamiento del proyecto con barra de progreso y espacio usado vs. disponible.",
      ],
      tips: [
        "La tasa de conversión se calcula como: (total de leads / visitantes únicos) × 100.",
        "Los datos se actualizan en tiempo real. Si no ves datos, verifica que tu micrositio esté publicado y haya recibido visitas.",
        "Las métricas financieras incluyen el revenue real basado en los precios de venta (precio_venta) registrados al marcar unidades como vendidas, no solo el precio de lista.",
        "Usa los datos de fuentes de tráfico para identificar qué canales de marketing están generando más visitas y optimizar tu inversión publicitaria.",
        "El indicador de almacenamiento en la barra lateral muestra cuánto espacio ha usado tu proyecto (imágenes, videos, documentos, tours). Si se acerca al límite, el color cambiará de dorado a amarillo a rojo.",
      ],
    },

    /* ────────────────────────────────────────────
       PROYECTO
    ──────────────────────────────────────────── */
    general: {
      title: "General del Proyecto",
      description:
        "Nombre, landing, constructora, colores y configuración SEO",
      content:
        "La pestaña General contiene la configuración base de tu proyecto, dividida en 5 sub-pestañas que cubren desde los datos básicos hasta el SEO y la configuración legal.",
      steps: [
        "«Proyecto»: Define el nombre del proyecto y su slug (URL). El estado puede ser borrador, publicado o archivado.",
        "«Inicio»: Sube la imagen hero principal (render del proyecto), el logo, un video hero opcional y escribe la descripción que aparecerá en la landing.",
        "«Constructora»: Ingresa el nombre de tu constructora, sube su logo y agrega el enlace a tu sitio web corporativo.",
        "«Diseño»: Personaliza los colores del micrositio — color primario (acento principal), secundario y de fondo. Los cambios se reflejan en tiempo real.",
        "«Avanzado»: Sube un favicon personalizado, una imagen para compartir en redes (OG Image, idealmente 1200×630px), escribe el texto del disclaimer legal y la URL de tu política de privacidad.",
      ],
      tips: [
        "La imagen hero es lo primero que ven los visitantes. Usa un render de alta calidad en formato horizontal (16:9).",
        "El color primario se usa para botones, acentos y elementos interactivos en todo el micrositio. Elige un tono que represente tu marca.",
        "La imagen OG aparece cuando compartes el link de tu micrositio en WhatsApp, Facebook, Twitter y LinkedIn.",
        "El tipo de proyecto (torres, urbanismo, híbrido, lotes) se configura desde la pestaña «Configuración», donde también puedes personalizar las columnas del inventario.",
      ],
    },
    torres: {
      title: "Torres y Urbanismos",
      description:
        "Administra edificios, composición de pisos y amenidades",
      content:
        "Si tu proyecto tiene múltiples edificios o etapas, puedes crear varias torres. Cada torre tiene su propia información, composición de pisos, amenidades, fachadas y unidades. También puedes usar el tipo «Urbanismo» para proyectos de casas o conjuntos horizontales.",
      steps: [
        "Haz clic en «Agregar Torre» y selecciona el tipo: Torre (edificio vertical) o Urbanismo (conjunto horizontal).",
        "Asígnale un nombre y un prefijo (T1, U1, etc.) que se usará para identificar las unidades.",
        "En la pestaña «Info» configura la composición del edificio: número de sótanos, planta baja, podios, pisos residenciales y rooftop. Una barra visual mostrará la proporción.",
        "En la pestaña «Amenidades» selecciona las amenidades disponibles del catálogo (piscina, gimnasio, salón social, etc.) o agrega amenidades personalizadas.",
        "Sube una imagen de portada y un logo específico para cada torre.",
        "Para proyectos de una sola torre, no necesitas crear torres — el sistema funciona automáticamente.",
      ],
      tips: [
        "La composición de pisos se usa para visualizar la distribución del edificio en el micrositio. Asegúrate de que los números sean correctos.",
        "Si decides desactivar el modo multi-torre, se conservará solo la primera torre y se eliminarán las demás.",
        "Las amenidades aparecerán como íconos interactivos en la página de exploración del micrositio.",
      ],
    },

    /* ────────────────────────────────────────────
       CONTENIDO
    ──────────────────────────────────────────── */
    tipologias: {
      title: "Tipologías",
      description:
        "Tipos de propiedad con especificaciones, planos, hotspots y video vinculado",
      content:
        "Las tipologías representan los tipos de propiedad de tu proyecto (Apto 1 hab, Apto 2 hab, Casa esquinera, etc.). Cada tipología tiene sus especificaciones, planos y puede asignarse a una o más torres. Puedes asignar un tipo de propiedad (apartamento, casa, lote) y vincular un video del proyecto.",
      steps: [
        "Haz clic en «+» para crear una nueva tipología. Dale un nombre descriptivo.",
        "En «General» escribe la descripción, características (como tags separados por coma: balcón, vista exterior, piso alto) y asigna las torres donde está disponible.",
        "En «Especificaciones» ingresa: área interna (m²), área de balcón, área construida, área privada y área de lote (según la configuración del proyecto), además de habitaciones, baños y parqueaderos. El área total se calcula automáticamente.",
        "Selecciona el tipo de propiedad de la tipología: apartamento, casa o lote. Este tipo determina qué columnas de inventario se muestran para las unidades de esta tipología.",
        "Si tu proyecto tiene videos configurados, puedes vincular un video a la tipología. Los visitantes del micrositio verán un botón «Ver Video» que abre el video asociado.",
        "En «Plano» sube la imagen del plano arquitectónico y opcionalmente la ubicación en el plano del proyecto.",
        "En «Hotspots» puedes agregar puntos interactivos sobre el plano. Los visitantes podrán hacer clic en ellos para ver detalles o renders.",
        "Usa «Clonar a torre» para copiar una tipología a otro edificio con un solo clic.",
      ],
      tips: [
        "El precio se calcula automáticamente desde la unidad más económica disponible en el inventario. No necesitas ingresarlo manualmente.",
        "Los hotspots requieren que primero subas una imagen de plano. Aparecen como puntos dorados que los visitantes pueden explorar.",
        "Si tienes múltiples torres, puedes filtrar las tipologías por torre usando las pestañas superiores.",
        "Los campos de área disponibles (construida, privada, lote) dependen de la configuración del proyecto. Puedes activarlos o desactivarlos desde la pestaña de Configuración.",
        "Al vincular un video, solo se muestran videos procesados y listos. Los videos en proceso de carga no aparecen en la lista.",
      ],
    },
    inventario: {
      title: "Inventario de Unidades",
      description:
        "Gestión de unidades, columnas personalizadas, precio de venta, IA y operaciones masivas",
      content:
        "El inventario contiene todas las unidades individuales de tu proyecto (apartamentos, casas, locales). Cada unidad tiene un identificador único, tipología asignada, y un estado de disponibilidad. Las columnas visibles son configurables según el tipo de proyecto, y puedes agregar columnas personalizadas.",
      steps: [
        "Haz clic en «+» para agregar una unidad individual. Asigna un identificador (ej: 101, 1001A), selecciona la tipología, piso, área, precio y estado.",
        "Para importar muchas unidades, usa «Importar CSV». Descarga la plantilla, llena los datos en Excel y súbela.",
        "Usa el asistente de IA para extraer datos de unidades: pega texto de cualquier fuente o adjunta archivos (brochures, PDFs, tablas). El asistente se abre en un panel lateral donde puedes interactuar en un chat, revisar los datos extraídos y confirmar la importación.",
        "Cambia el estado de una unidad haciendo clic en su badge de estado: disponible (verde), separado (amarillo), reservada (azul) o vendida (rojo). Los cambios se aplican instantáneamente con actualización optimista.",
        "Cuando una unidad se marca como «vendida», puedes registrar el precio de venta real (precio_venta). Este precio se bloquea automáticamente y se usa para las métricas financieras.",
        "Para operaciones masivas, selecciona varias unidades con los checkboxes y cambia su estado o elimínalas de una vez.",
        "Las columnas visibles del inventario se configuran desde la pestaña «Configuración». Puedes elegir qué columnas mostrar en el editor y cuáles en el micrositio público.",
        "Crea columnas personalizadas desde el botón de ajustes del inventario. Las columnas personalizadas pueden ser de texto, número o selección, y se muestran tanto en el editor como opcionalmente en el micrositio.",
        "Exporta el inventario completo a CSV con el botón «Exportar».",
      ],
      tips: [
        "Los colaboradores solo pueden cambiar el estado de las unidades, no crear ni eliminar. Esto es ideal para que tu equipo de ventas actualice la disponibilidad en tiempo real.",
        "El asistente de IA acepta archivos adjuntos (imágenes de brochures, PDFs, tablas). Usa el chat para refinar los datos extraídos antes de importarlos.",
        "Los estados se reflejan inmediatamente en el micrositio público. Las actualizaciones son optimistas — ves el cambio al instante sin esperar la respuesta del servidor.",
        "El precio de venta (precio_venta) solo aparece para unidades vendidas. Se registra automáticamente al cambiar el estado a vendida y no puede modificarse después.",
        "Puedes configurar un prefijo de visualización para las unidades (ej: «Apto», «Casa», «Lote») desde la pestaña de Configuración. Este prefijo se muestra antes del identificador en el micrositio.",
      ],
    },
    cotizador: {
      title: "NodDo Quote",
      description:
        "Configura fases de pago, descuentos y simulador interactivo",
      content:
        "NodDo Quote te permite configurar un simulador de financiación que los visitantes de tu micrositio pueden usar para calcular cuotas y plan de pagos. Defines las fases (separación, inicial, entrega), descuentos aplicables y notas legales. El simulador genera PDFs descargables con el plan de pagos personalizado.",
      steps: [
        "En el editor, accede a la pestaña «NodDo Quote».",
        "Selecciona la moneda de tu proyecto (COP, USD, MXN).",
        "Configura las fases de pago: cada fase puede ser de tipo «fijo» (monto en moneda), «porcentaje» (% del precio de la unidad) o «resto» (saldo restante).",
        "Para cada fase define: nombre, tipo, valor, número de cuotas y frecuencia (única, mensual, bimestral, trimestral).",
        "Reordena las fases arrastrándolas. El orden determina cómo se calcula el simulador.",
        "Activa la opción «Separación incluida en inicial» si quieres que el monto de separación se descuente de la cuota inicial.",
        "Opcionalmente agrega descuentos: puedes crear descuentos por pronto pago, early bird, lanzamiento, etc. Cada descuento tiene un porcentaje y puede aplicarse al precio base o a una fase específica.",
        "Escribe las notas legales que aparecerán en el PDF de la cotización (condiciones, tasa de interés, políticas, etc.).",
        "Usa el preview interactivo para probar el simulador antes de publicar.",
      ],
      tips: [
        "El simulador es una herramienta poderosa de conversión — los visitantes que generan una cotización son leads altamente cualificados.",
        "Las cotizaciones generadas se guardan automáticamente en la sección «NodDo Quote» del dashboard, donde puedes ver el historial completo y descargar los PDFs.",
        "Si cambias la configuración de NodDo Quote, las cotizaciones anteriores NO se actualizan — se conservan con la configuración que tenían al momento de generarse.",
        "El simulador solo aparece en el micrositio si tienes al menos una unidad con precio configurado en el inventario.",
      ],
    },
    fachadas: {
      title: "Noddo Grid (Fachadas)",
      description:
        "Renderizados de fachadas con hotspots interactivos y etiquetas de unidades",
      content:
        "El Noddo Grid te permite subir imágenes de las fachadas de tus edificios y colocar puntos interactivos (hotspots) que los visitantes pueden explorar. Cada hotspot puede enlazar a una tipología o mostrar información adicional. Las unidades se visualizan con etiquetas en la cuadrícula.",
      steps: [
        "Haz clic en «+» para crear una nueva fachada. Dale un nombre y opcionalmente asígnala a una torre.",
        "Sube la imagen del render de la fachada del edificio.",
        "Haz clic en cualquier punto de la imagen para agregar un hotspot. Asígnale un nombre y opcionalmente enlázalo a una tipología.",
        "Arrastra los hotspots para reposicionarlos sobre la imagen.",
        "Para renombrar una fachada, haz clic directamente sobre su nombre en la lista. El nombre se edita en línea sin necesidad de abrir un formulario.",
        "Usa «Duplicar hotspots» para copiar los puntos de una fachada a otra (útil para fachadas con distribución similar).",
      ],
      tips: [
        "Usa renders de alta calidad con buena resolución. La imagen se mostrará a pantalla completa en el micrositio.",
        "Los hotspots se muestran como puntos dorados brillantes que los visitantes pueden explorar en la sección «Explorar» del micrositio.",
        "Cada hotspot muestra la etiqueta de la unidad correspondiente en la cuadrícula, facilitando la identificación visual.",
        "El indicador de guardado muestra el estado actual (guardando, guardado) para que siempre sepas si tus cambios se han persistido.",
      ],
    },
    planos: {
      title: "Implantaciones",
      description:
        "Planos del proyecto con puntos interactivos",
      content:
        "Las implantaciones son planos generales del proyecto (planta de urbanización, distribución del conjunto) donde puedes colocar puntos interactivos que enlazan a torres, zonas comunes o amenidades.",
      steps: [
        "Crea una nueva implantación y sube la imagen del plano general.",
        "Haz clic sobre la imagen para agregar puntos. Cada punto puede tener un nombre, descripción e ícono.",
        "Opcionalmente enlaza cada punto a una tipología existente para que los visitantes naveguen directamente.",
        "Reordena los puntos arrastrándolos en la lista.",
      ],
      tips: [
        "Usa un plano claro y de buena resolución. Los planos arquitectónicos renderizados funcionan mejor que los escaneados.",
        "Las implantaciones son especialmente útiles para proyectos de urbanismo (casas) donde la distribución espacial es clave.",
      ],
    },
    galeria: {
      title: "Galería de Imágenes",
      description:
        "Categorías, carga masiva, recorte y reordenamiento",
      content:
        "La galería te permite organizar las imágenes de tu proyecto en categorías (Fachada, Interiores, Zonas comunes, Renders, etc.). Los visitantes navegan entre categorías con un slider a pantalla completa.",
      steps: [
        "Crea una categoría haciendo clic en «+». Dale un nombre descriptivo (ej: Renders, Interiores, Amenidades).",
        "Selecciona una categoría y haz clic en «Subir imágenes» para cargar fotos. Puedes seleccionar múltiples archivos a la vez.",
        "Al subir, puedes recortar cada imagen seleccionando la relación de aspecto deseada.",
        "Reordena las categorías arrastrándolas en la barra de pestañas.",
        "Reordena las imágenes dentro de cada categoría arrastrándolas en la cuadrícula.",
        "Elimina imágenes individuales con el botón de eliminar en cada una.",
      ],
      tips: [
        "Las imágenes se optimizan automáticamente al subirlas (formato WebP, tamaño máximo 1920px). No necesitas comprimirlas antes.",
        "Recomendamos al menos 3-5 imágenes por categoría para una buena experiencia de galería.",
        "El orden de las categorías determina el orden en que aparecen en el micrositio.",
      ],
    },
    videos: {
      title: "Videos",
      description: "Videos de YouTube y videos hospedados con drag-and-drop",
      content:
        "Agrega videos a tu proyecto de dos formas: pega una URL de YouTube o sube un archivo de video directamente para que se hospede en NODDO. Los videos se muestran en un reproductor a pantalla completa en el micrositio.",
      steps: [
        "Haz clic en «+» para agregar un video. Elige entre «URL» para pegar un enlace de YouTube, o «Subir» para cargar un archivo de video directamente.",
        "Si eliges URL: pega la URL de YouTube y el sistema extraerá automáticamente el título y la miniatura.",
        "Si eliges Subir: selecciona un archivo de video (MP4, WebM). El video se subirá y procesará automáticamente. Verás un indicador de progreso y estado de procesamiento.",
        "Edita el título del video si deseas personalizarlo.",
        "Reordena los videos arrastrándolos en la lista. El primero será el que se reproduzca por defecto.",
        "Elimina un video con el botón de eliminar.",
      ],
      tips: [
        "Usa videos de YouTube no listados si no quieres que aparezcan en búsquedas públicas pero sí en tu micrositio.",
        "El primer video de la lista es el que se muestra al entrar a la sección de Videos del micrositio.",
        "Los videos subidos se procesan en la nube. Mientras se procesan, verás un indicador de estado. Una vez listos, se reproducen directamente sin depender de YouTube.",
        "La funcionalidad de subida de videos (video hosting) puede requerir activación en tu plan. Si no ves la opción, contacta al soporte.",
      ],
    },
    tour: {
      title: "Tour 360",
      description:
        "Tour virtual inmersivo con Matterport o archivos propios",
      content:
        "La pestaña Tour 360 te permite configurar un recorrido virtual inmersivo de tu proyecto. Puedes pegar una URL de Matterport o subir tu propio tour (ZIP o carpeta) para que se aloje directamente en NODDO. El tour se muestra como una sección a pantalla completa en el micrositio.",
      steps: [
        "Accede a la pestaña «Tour 360» en el editor de tu proyecto.",
        "Elige entre dos opciones: «URL» para pegar un enlace de Matterport u otro proveedor, o «Subir» para hospedar el tour directamente en NODDO.",
        "Si eliges URL: pega la dirección del tour (ej: https://my.matterport.com/show/?m=...). El sistema extrae automáticamente la URL embebible aunque pegues un enlace completo o código iframe.",
        "Si eliges Subir: arrastra un archivo ZIP o selecciona una carpeta con los archivos del tour. También puedes usar el botón «Seleccionar carpeta» para elegir la carpeta directamente.",
        "El progreso de subida se muestra en una barra de progreso con el conteo de archivos subidos. Puedes cancelar la subida en cualquier momento.",
        "Cuando la subida se completa, el tour se aloja en la infraestructura de NODDO y se configura automáticamente.",
        "Una vista previa del tour aparece en la parte inferior de la sección, con un enlace para abrirlo en una pestaña nueva.",
        "Para reemplazar un tour alojado, usa el botón «Reemplazar». Para eliminarlo, usa «Eliminar tour».",
      ],
      tips: [
        "La subida de archivos del tour funciona en segundo plano — puedes navegar a otras pestañas del editor mientras se completa. Un indicador flotante te mostrará el progreso.",
        "Si cierras o navegas fuera del editor durante una subida activa, el sistema te advertirá para evitar que pierdas el progreso.",
        "Los tours alojados en NODDO cargan más rápido para los visitantes que los embebidos de terceros, ya que se sirven desde nuestra CDN.",
        "Formatos soportados para subida: archivo ZIP o carpeta con los archivos del tour (HTML, JS, CSS, assets).",
      ],
    },
    ubicacion: {
      title: "Ubicación y Mapa",
      description:
        "Mapa interactivo, puntos de interés y descubrimiento con IA",
      content:
        "Configura la ubicación de tu proyecto en el mapa y agrega puntos de interés (POIs) cercanos como colegios, centros comerciales, hospitales y transporte. Los visitantes verán un mapa interactivo satelital con todos los puntos.",
      steps: [
        "En la pestaña «Ubicación» ingresa la dirección, latitud y longitud de tu proyecto. Puedes usar el selector de mapa para ubicar el punto exacto.",
        "En la pestaña «POIs» haz clic en «+» para agregar puntos de interés manualmente. Selecciona la categoría (Comercio, Recreación, Salud, Educación, Transporte, Gastronomía, Cultura, Deporte).",
        "Ingresa el nombre, descripción, coordenadas (usa el selector de mapa), y opcionalmente sube una foto del lugar.",
        "La distancia y tiempo de viaje se calculan automáticamente basándose en las coordenadas.",
        "Usa «Descubrir POIs» para que la IA encuentre automáticamente lugares de interés cercanos a tu proyecto. Revisa los resultados y selecciona cuáles agregar.",
      ],
      tips: [
        "Los POIs se muestran como puntos blancos en el mapa satelital. Al hacer clic, se muestra un panel con la foto, nombre, distancia y tiempo de viaje.",
        "El descubrimiento con IA funciona mejor cuando la dirección y coordenadas del proyecto están correctas.",
        "Las categorías tienen íconos específicos que ayudan a los visitantes a identificar rápidamente cada tipo de lugar.",
      ],
    },
    vistas: {
      title: "Vistas de Piso",
      description:
        "Define vistas por orientación y rango de pisos con asignación automática",
      content:
        "Las Vistas de Piso te permiten configurar las líneas de visión disponibles en tu proyecto según la orientación, rango de pisos y tipología. Las unidades del inventario se asignan automáticamente a sus vistas correspondientes según su piso y tipología.",
      steps: [
        "Accede a la pestaña «Vistas» en el editor de tu proyecto.",
        "Haz clic en «Nueva Vista» para crear una vista. Asígnale un nombre descriptivo (ej: Vista al parque, Vista ciudad norte).",
        "Selecciona la orientación de la vista (Norte, Sur, Este, Oeste, etc.) usando las sugerencias del campo o escribiendo una personalizada.",
        "Define el rango de pisos donde aplica esta vista: piso mínimo y piso máximo.",
        "Si tienes múltiples torres, asigna la vista a una torre específica o déjala como general para todas.",
        "Selecciona las tipologías que tienen esta vista disponible usando las casillas de selección múltiple.",
        "Sube una imagen representativa de la vista (render o foto real). La imagen se muestra como tarjeta en la cuadrícula de vistas.",
        "Opcionalmente agrega una descripción de la vista.",
        "Al guardar, las unidades del inventario que coincidan con la torre, rango de pisos y tipología se asignarán automáticamente a esta vista. El sistema te mostrará cuántas unidades fueron asignadas.",
      ],
      tips: [
        "Las vistas se asignan automáticamente a las unidades del inventario. No necesitas asignar manualmente cada unidad — el sistema lo hace por ti basándose en el piso y la tipología.",
        "La sección «Resumen de asignaciones» te muestra una tabla con todas las unidades y su vista asignada, útil para verificar que la configuración es correcta.",
        "Si tu proyecto tiene múltiples torres, puedes filtrar las vistas por torre usando las pestañas superiores.",
        "Las imágenes de las vistas aparecen en las tarjetas con información de orientación, rango de pisos y conteo de unidades asignadas.",
      ],
    },
    recursos: {
      title: "Recursos y Documentos",
      description:
        "Brochures con visor PDF integrado, fichas técnicas y documentos descargables",
      content:
        "Sube documentos que los visitantes de tu micrositio pueden descargar o visualizar: brochures comerciales, fichas técnicas, listas de precios, especificaciones de acabados, etc. Los brochures en PDF se pueden visualizar directamente en el navegador con un visor integrado.",
      steps: [
        "Haz clic en «+» para agregar un nuevo recurso.",
        "Selecciona el tipo de recurso: Brochure, Acabados, Ficha Técnica, Precios u Otro.",
        "Sube el archivo (PDF recomendado) y dale un nombre descriptivo.",
        "Los recursos aparecerán como tarjetas descargables en la sección «Recursos» del micrositio.",
        "Los brochures en formato PDF se abren en un visor integrado con navegación por páginas, zoom y descarga directa. Los visitantes pueden explorar el brochure sin salir del micrositio.",
      ],
      tips: [
        "Los brochures PDF se visualizan inline en el micrositio con un visor interactivo que soporta navegación entre páginas y zoom. No es necesario que el visitante descargue el archivo para verlo.",
        "Mantén los archivos ligeros (menos de 10MB) para una descarga rápida y una visualización fluida del visor PDF.",
        "Otros formatos distintos a PDF se descargarán al hacer clic.",
      ],
    },
    avances: {
      title: "Avances de Obra",
      description:
        "Timeline de progreso de construcción con fotos y videos",
      content:
        "Documenta el progreso de la construcción de tu proyecto con fotos, videos y descripciones. Los visitantes verán un timeline cronológico en el micrositio.",
      steps: [
        "Haz clic en «+» para crear un nuevo registro de avance.",
        "Agrega un título, descripción, fecha y sube fotos del estado actual de la obra.",
        "Opcionalmente puedes agregar un enlace a un video de YouTube.",
        "Los avances se ordenan cronológicamente (más reciente primero) en el micrositio.",
        "Reordena los avances si necesitas ajustar el orden.",
      ],
      tips: [
        "Publicar avances regularmente genera confianza en los compradores potenciales y mantiene el interés en el proyecto.",
        "Usa fotos de buena calidad que muestren claramente el progreso de la construcción.",
      ],
    },

    /* ────────────────────────────────────────────
       AJUSTES
    ──────────────────────────────────────────── */
    config: {
      title: "Configuración General",
      description:
        "Tipo de proyecto, columnas de inventario, WhatsApp, visualización y opciones de micrositio",
      content:
        "La pestaña de Configuración contiene ajustes que controlan la estructura de tu proyecto, las columnas del inventario, funcionalidades especiales del micrositio y opciones de visualización.",
      steps: [
        "«Tipo de proyecto»: Selecciona el tipo de tu proyecto: Torres (edificios verticales), Urbanismo (casas/conjuntos horizontales), Lotes (terrenos), o Híbrido (mezcla de apartamentos, casas, lotes y/o locales comerciales en un mismo proyecto). El tipo determina las columnas de inventario disponibles y el comportamiento del sistema.",
        "«Columnas del inventario»: Personaliza qué campos se muestran en la tabla de inventario del editor y del micrositio. Puedes activar/desactivar columnas como área construida, área privada, área de lote, orientación, vista, piso, etc.",
        "«WhatsApp»: Ingresa el número de WhatsApp con código de país (ej: 573001234567). Aparecerá un botón flotante en el micrositio.",
        "«Prefijo de unidades»: Configura un prefijo que se muestra antes del identificador de cada unidad en el micrositio (ej: «Apto», «Casa», «Lote»).",
        "«Ocultar vendidas»: Activa este toggle para que las unidades vendidas no se muestren en el micrositio público. Seguirán visibles en el editor.",
        "«Ocultar precio de vendidas»: Activa este toggle para ocultar el precio de las unidades marcadas como vendidas en el micrositio.",
        "«Etiqueta de etapa»: Personaliza cómo se llama la sección de torres/etapas (por defecto: «Grid»).",
        "«Ocultar badge NODDO»: Desactiva el sello «Powered by NODDO» que aparece en la esquina del micrositio.",
        "«Audio ambiental»: Sube un archivo de audio (MP3, WAV) que se reproducirá de fondo en el micrositio. Los visitantes pueden silenciarlo.",
      ],
      tips: [
        "El tipo de proyecto afecta las columnas disponibles automáticamente. Para proyectos híbridos, puedes configurar columnas diferentes para cada tipo de tipología (apartamento, casa, lote).",
        "El botón de WhatsApp es la forma más efectiva de recibir contactos. Asegúrate de que el número sea correcto y esté activo.",
        "El audio ambiental comienza silenciado por defecto. El visitante debe activarlo manualmente.",
        "La opción «Ocultar vendidas» es útil cuando no quieres mostrar a los visitantes las unidades que ya se vendieron.",
      ],
    },
    dominio: {
      title: "Dominio Personalizado",
      description:
        "Configura un dominio propio para tu micrositio",
      content:
        "Por defecto, tu micrositio está disponible en un subdominio de NODDO (tu-proyecto.noddo.io). Puedes conectar un dominio personalizado para una experiencia más profesional.",
      steps: [
        "En la pestaña «Dominio» verás tu subdominio actual (slug.noddo.io).",
        "Para conectar un dominio propio, ingresa el dominio completo (ej: www.miproyecto.com).",
        "El sistema te mostrará los registros DNS que debes configurar en tu proveedor de dominio.",
        "Una vez configurados los DNS, haz clic en «Verificar» para confirmar que el dominio está apuntando correctamente.",
        "Cuando la verificación sea exitosa, tu micrositio estará disponible en ambas URLs (subdominio + dominio propio).",
      ],
      tips: [
        "La propagación de DNS puede tomar hasta 48 horas, aunque generalmente se completa en menos de 1 hora.",
        "El certificado SSL se genera automáticamente una vez verificado el dominio.",
      ],
    },
    webhooks: {
      title: "Webhooks e Integraciones",
      description:
        "Conecta NODDO con tus sistemas externos vía webhooks",
      content:
        "Los webhooks te permiten integrar NODDO con tus sistemas externos (CRM, automatizaciones, bases de datos). Cuando ocurre un evento en tu micrositio (nuevo lead, cotización generada), NODDO envía automáticamente los datos a una URL que tú configures. Esto te permite sincronizar información en tiempo real sin intervención manual.",
      steps: [
        "En el editor, accede a la pestaña «Webhooks».",
        "Activa los webhooks con el toggle en la parte superior.",
        "Ingresa la URL de tu endpoint (debe ser HTTPS). NODDO enviará peticiones POST a esta URL cada vez que ocurra un evento.",
        "Selecciona los eventos que quieres recibir: «lead.created» (nuevo lead desde el formulario de contacto) y/o «cotizacion.created» (nueva cotización generada desde el simulador).",
        "Copia el secret (clave secreta) que NODDO genera automáticamente. Úsalo en tu servidor para verificar que las peticiones vienen realmente de NODDO mediante firma HMAC-SHA256.",
        "Haz clic en «Guardar» para activar la configuración.",
        "Usa el botón «Enviar Test» para probar que tu endpoint está recibiendo correctamente. NODDO enviará un payload de prueba.",
        "Revisa el historial de entregas en la tabla de logs: verás cada petición enviada, su estado (éxito/fallo), código HTTP de respuesta y timestamp.",
        "Haz clic en «Reintentar» en cualquier log fallido para volver a enviar el payload.",
      ],
      tips: [
        "Tu endpoint debe responder con código HTTP 200-299 en menos de 10 segundos. Si no responde a tiempo o retorna un error, NODDO reintentará automáticamente hasta 3 veces con backoff exponencial.",
        "El secret se usa para generar una firma HMAC-SHA256 del payload que se envía en el header `X-NODDO-Signature`. Verifica esta firma en tu servidor para garantizar que la petición es auténtica y no fue alterada.",
        "Los webhooks son ideales para integrar con CRMs como HubSpot, Salesforce, Pipedrive, GoHighLevel, o automatizaciones en Make.com, Zapier, n8n.",
        "El payload incluye todos los datos del evento: para leads incluye nombre, email, teléfono, mensaje, tipología de interés, UTMs; para cotizaciones incluye datos del cliente, unidad seleccionada, plan de pagos completo y URL del PDF.",
        "Si desactivas los webhooks, dejarán de enviarse peticiones pero el historial de logs se conserva.",
      ],
    },

    /* ────────────────────────────────────────────
       FLUJOS DE TRABAJO
    ──────────────────────────────────────────── */
    publicacion: {
      title: "Publicación y Versiones",
      description:
        "Publicar, despublicar, archivar y restaurar versiones de tu micrositio",
      content:
        "El sistema de publicación te permite controlar cuándo y dónde tus cambios se hacen visibles al público. Puedes elegir los destinos de publicación (subdominio NODDO y/o dominio personalizado), archivar o desarchivar el proyecto, y despublicar si necesitas retirar el sitio temporalmente.",
      steps: [
        "Cuando hagas cambios en el editor, el indicador de estado mostrará «Cambios sin publicar» (naranja).",
        "Haz clic en «Publicar» en la barra superior del editor. Se abrirá un menú donde puedes seleccionar los destinos de publicación: subdominio NODDO y/o dominio personalizado (si está configurado).",
        "Marca o desmarca los destinos y haz clic en «Publish Now» para hacer visibles los cambios.",
        "Se creará una nueva versión (v1, v2, v3...) con una copia completa de todo tu contenido.",
        "Para ver el historial de versiones, haz clic en el botón desplegable (flecha) junto al botón de publicar.",
        "Para restaurar una versión anterior, haz clic en «Restaurar» junto a la versión deseada. Se creará una nueva versión con el contenido restaurado.",
        "Para despublicar el micrositio (retirarlo del público sin eliminarlo), usa la opción «Despublicar» en el menú de versiones. El proyecto volverá a estado borrador.",
        "Para archivar o desarchivar el proyecto, usa la opción «Archivar proyecto» / «Desarchivar proyecto» al final del menú de versiones.",
      ],
      tips: [
        "El estado del proyecto se muestra en 3 colores: ámbar (borrador, nunca publicado), verde (publicado y actualizado), naranja (publicado pero con cambios pendientes).",
        "Restaurar una versión no elimina las versiones posteriores — se crea una nueva versión con el contenido antiguo, así que nunca pierdes datos.",
        "Los cambios se guardan automáticamente en el editor, pero NO se hacen públicos hasta que presiones «Publicar».",
        "Despublicar retira el micrositio del público pero conserva todo el contenido y las versiones. Puedes volver a publicar en cualquier momento.",
        "El selector de destinos te permite publicar solo en el subdominio NODDO, solo en tu dominio personalizado, o en ambos.",
      ],
    },
    autoguardado: {
      title: "Auto-guardado",
      description: "Cómo funciona el guardado automático",
      content:
        "NODDO guarda automáticamente todos tus cambios mientras editas. No necesitas presionar un botón de guardar — tus cambios se preservan incluso si cierras el navegador.",
      steps: [
        "Cuando modificas cualquier campo en el editor, un temporizador de 1.5 segundos se activa.",
        "Al cumplirse, los datos se envían al servidor. Verás un indicador «Guardando...» seguido de «Guardado ✓».",
        "Si cambias de pestaña o cierras la página antes de que se complete el guardado, el sistema guarda automáticamente los cambios pendientes.",
        "Los cambios guardados son privados hasta que publiques el proyecto.",
      ],
      tips: [
        "El auto-guardado funciona en todas las pestañas del editor: General, Torres, Tipologías, etc.",
        "Si ves que el indicador de guardado no cambia a «Guardado ✓», verifica tu conexión a internet.",
        "Recuerda: guardar ≠ publicar. Los cambios se guardan en tu cuenta pero no son visibles al público hasta que publiques.",
      ],
    },
    iaCreacion: {
      title: "Creación con Inteligencia Artificial",
      description:
        "Crea un proyecto completo a partir de texto o documentos",
      content:
        "El asistente de IA te permite crear un proyecto completo en minutos. Solo necesitas proporcionarle información sobre tu proyecto inmobiliario — desde texto suelto hasta brochures completos — y el sistema extraerá todos los datos automáticamente.",
      steps: [
        "Haz clic en «Crear con IA» desde el panel de proyectos.",
        "En el chat, describe tu proyecto: nombre, constructora, ubicación, tipologías, precios, características, etc.",
        "También puedes subir archivos (imágenes de brochures, PDFs, fichas técnicas) para que la IA extraiga la información.",
        "En el panel derecho verás los datos que la IA ha extraído, incluyendo nombre, colores, tipologías y progreso general.",
        "Si la IA necesita más información, te mostrará preguntas pendientes en el panel. Respóndelas en el chat.",
        "Cuando los datos estén completos (o al menos tengas el nombre del proyecto), haz clic en «Crear Proyecto».",
        "El sistema creará automáticamente el proyecto con todas las tipologías, colores y configuraciones extraídas.",
      ],
      tips: [
        "Mientras más información le des a la IA, más completo será el proyecto creado. Pero con solo el nombre ya puedes empezar.",
        "Puedes subir imágenes de brochures impresos — la IA puede leer texto de las imágenes.",
        "Después de crear el proyecto, puedes editar y ajustar cualquier dato desde el editor normal.",
      ],
    },
    archivos: {
      title: "Subida de Archivos",
      description:
        "Formatos soportados, tamaños máximos y optimización",
      content:
        "NODDO soporta la subida de imágenes, videos y documentos. Las imágenes se optimizan automáticamente al subirlas para garantizar tiempos de carga rápidos en el micrositio.",
      steps: [
        "Arrastra y suelta archivos en cualquier zona de carga, o haz clic para seleccionar desde tu computador.",
        "Las imágenes se convierten automáticamente a formato WebP con un ancho máximo de 1920px y calidad del 80%. También se genera una miniatura de 400px.",
        "Los formatos de imagen soportados son: JPEG, PNG, WebP, GIF, AVIF, TIFF y BMP. Tamaño máximo: 10MB.",
        "Los videos soportados son: MP4 y WebM. Tamaño máximo: 50MB.",
        "Los audios soportados son: MP3, WAV, OGG y M4A. Tamaño máximo: 15MB.",
        "Al subir imágenes, puedes usar la herramienta de recorte para ajustar la proporción (16:9, cuadrado, logo, etc.).",
      ],
      tips: [
        "No necesitas optimizar las imágenes antes de subirlas — el sistema lo hace automáticamente.",
        "Para videos grandes, el navegador los comprime del lado del cliente antes de subirlos.",
        "Si una imagen se ve borrosa en el micrositio, intenta subir una versión de mayor resolución (mínimo 1920px de ancho para renders hero).",
      ],
    },
  },
} as const;

export default help;
