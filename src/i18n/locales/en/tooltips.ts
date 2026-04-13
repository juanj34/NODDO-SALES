const tooltips = {
  /* ═══════════════════════════════════════════════════════════════════
     General — Sub-tabs: project, landing, developer, design, advanced
     ═══════════════════════════════════════════════════════════════════ */
  general: {
    renderPrincipal: {
      short: "Main image displayed as the hero background on the landing page.",
      long: "Upload a **high-quality render** (ideally 1920x1080 or higher). This image fills the entire screen as the first visual impact of the microsite. Recommended format: **16:9 landscape**.",
    },
    logo: {
      short: "Project logo displayed centered over the hero section.",
      long: "Upload the logo in **PNG with transparent background** for best results. The visible size can be adjusted with the height slider. A horizontal (landscape) logo is recommended.",
    },
    logoHeight: {
      short: "Controls the logo size over the microsite hero.",
      long: "Adjust the **height in pixels** of the logo. Default is 96px. A larger logo creates more visual presence, but make sure it doesn't cover too much of the background render.",
    },
    heroVideo: {
      short: "Short video that replaces the hero background image.",
      long: "If you upload a video, it replaces the main render as the hero background. Use a **short video (10-30 sec), looping, without sound**, in MP4 or WebM format. It plays automatically on mute.",
    },
    descripcion: {
      short: "Project description visible on the microsite landing page.",
      long: "This description appears below the hero. Use an **aspirational but informative tone**: location, lifestyle, highlighted amenities. Maximum 5000 characters. Supports AI-powered improvement.",
    },
    favicon: {
      short: "Small icon that appears in the browser tab.",
      long: "Upload a **square image** (ideally 32x32 or 512x512 px). It appears in the browser tab, bookmarks, and search results. Recommended formats: PNG, SVG, or ICO.",
    },
    ogImage: {
      short: "Preview image when the link is shared on social media.",
      long: "The **Open Graph** image appears when someone shares the microsite link on WhatsApp, Facebook, LinkedIn, etc. Ideal size: **1200x630 px**. If not configured, the main render is used.",
    },
    backgroundAudio: {
      short: "Ambient background music for the microsite.",
      long: "Upload an audio file (MP3, WAV, OGG) that will play as **background music** when browsing the microsite. Visitors can pause it. Use it to create atmosphere — something subtle and elegant.",
    },
    colorPrimario: {
      short: "Main accent color for the microsite.",
      long: "This color is applied to **buttons, links, highlighted borders, and accent elements** throughout the microsite. Choose a color that represents the project's identity. Can be reset to the default gold.",
    },
    temaModo: {
      short: "Select the microsite visual mode: dark or light.",
      long: "**Dark** mode (default) offers a premium luxury look. **Light** mode uses bright backgrounds for a more open, modern feel. All text and surface colors adapt automatically.",
    },
    disclaimer: {
      short: "Legal text displayed in the microsite footer.",
      long: "Add disclaimers, legal notices, or regulatory text. This text is shown at the bottom of every microsite page in small type. Example: *Images are illustrative and may not represent the final product.*",
    },
    privacyPolicy: {
      short: "URL to your data privacy policy page.",
      long: "Enter the full URL (https://...) to your **privacy policy**. It will appear as a link in the footer and on the contact form to comply with data protection regulations.",
    },
    idioma: {
      short: "Language in which the microsite is displayed to visitors.",
      long: "Choose between **Spanish** and **English**. This affects all interface text on the microsite (buttons, labels, messages). Content you enter in the editor (descriptions, names) is displayed as-is.",
    },
    estadoConstruccion: {
      short: "Current construction status, shown in PDF quotes.",
      long: "**Off-Plan:** Construction hasn't started. **Under Construction:** Work in progress. **Delivered:** Units are ready for handover. This status appears in the PDF quote document.",
    },
    politicaAmoblado: {
      short: "Defines whether units include furnishing or it's optional.",
      long: "**Not applicable:** No furnishing info shown. **Included:** All units come furnished (shown on PDF). **Optional:** The agent can toggle furnishing on/off when generating each individual quote.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Config — Sub-tabs: general, typologies, inventory, microsite, etc.
     ═══════════════════════════════════════════════════════════════════ */
  config: {
    slug: {
      short: "Unique URL identifier for the project on NODDO.",
      long: "The slug defines the microsite URL: **noddo.io/sites/{slug}**. Only lowercase letters, numbers, and hyphens are allowed. Once published, changing the slug breaks existing links.",
    },
    tipoProyecto: {
      short: "Defines the type of real estate units in the project.",
      long: "**Apartments:** Units in towers with floors. **Houses:** Standalone units with lots. **Lots:** Land only. **Hybrid:** Mix of types — apartments, houses, lots, and/or commercial units in a single project. This selection affects which fields appear in typologies and inventory.",
    },
    tipologiaMode: {
      short: "Controls how typologies are assigned to units.",
      long: "**Fixed:** Each unit has a single typology. **Multiple:** A unit can belong to multiple typologies (e.g., an apt offered in 2-bed and 3-bed versions). Multiple mode is more flexible but requires more setup.",
    },
    precioSource: {
      short: "Defines where the displayed price comes from.",
      long: "**From unit:** Each unit has its own individual price. **From typology:** Uses the typology's base price for all units of the same type. Useful when all units of the same type cost the same.",
    },
    etapaLabel: {
      short: "Label for the visual grouping in the interactive grid.",
      long: "Defines how facades are grouped in the microsite: **Grid**, **Phase**, **Sector**, **Block**, **Zone**, or **Building**. Use the term that best describes your project's physical organization.",
    },
    unitPrefix: {
      short: "Prefix prepended to each unit identifier.",
      long: "Displayed before the unit number throughout the system. Example: if the prefix is **Apt** and the unit is **301**, it shows as **Apt 301**. Leave empty if no prefix is needed.",
    },
    whatsapp: {
      short: "WhatsApp number for the floating button on the microsite.",
      long: "Enter the number with **country code without +** (e.g., 573001234567). This number is used for the floating WhatsApp button that appears throughout the microsite. It's the primary contact channel for buyers.",
    },
    seccionesVisibles: {
      short: "Controls which microsite sections are visible.",
      long: "Toggle each microsite section on or off. Disabled sections **do not appear** in navigation and are not accessible. Useful for hiding sections that don't have content yet or don't apply to the project.",
    },
    agentMode: {
      short: "Special mode for real estate agents with restrictions.",
      long: "When enabled, **external agents** see a restricted version of the microsite based on your settings: no prices, no sold units, no NodDo Quote, etc. Useful for controlling what information agents share with clients.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Torres (Towers)
     ═══════════════════════════════════════════════════════════════════ */
  torres: {
    concepto: {
      short: "Towers organize your project into buildings or blocks.",
      long: "Each **tower** groups units, facades, and galleries. A project can have one or multiple towers. Units, facades, and gallery categories can be associated with specific towers to better organize content.",
    },
    nombre: {
      short: "Tower name visible on the microsite and inventory.",
      long: "Use a descriptive name like **North Tower**, **Block A**, **Phase 1**, etc. This name appears in microsite filters and PDF quotes.",
    },
    descripcion: {
      short: "Tower description visible on the microsite.",
      long: "Describe the unique features of this tower: number of floors, views, finishes, exclusive amenities. Supports AI-powered improvement for a more professional tone.",
    },
    amenidades: {
      short: "List of amenities and common areas for this tower.",
      long: "Enter amenities separated by commas. Example: **Pool, Gym, Social lounge, BBQ area**. These appear as tags in the tower detail section on the microsite.",
    },
    imagenUrl: {
      short: "Representative image of the tower for the microsite.",
      long: "Upload a render or photo that represents this tower. It appears as the **featured image** in the towers section of the microsite. Recommended size: 1200x800 px or larger.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Tipologias (Typologies)
     ═══════════════════════════════════════════════════════════════════ */
  tipologias: {
    concepto: {
      short: "Typologies define the unit types in your project.",
      long: "A **typology** is a unit model (e.g., 2-Bedroom Apt, Corner House, 200m2 Lot). It defines the base characteristics (area, bedrooms, starting price) shared by all units of that type.",
    },
    tipoTipologia: {
      short: "Classifies the typology by property type.",
      long: "Options depend on the **project type**: apartment, house, lot, penthouse, studio, commercial, office, warehouse. This classification affects which fields and inventory columns are shown for units of this typology.",
    },
    renders: {
      short: "Render images showing how this typology looks.",
      long: "Upload multiple renders for the typology. These are displayed in the **typology slider** on the microsite as full-screen background images. Horizontal 16:9 format in high resolution is recommended.",
    },
    plano: {
      short: "Architectural floor plan of the typology.",
      long: "Upload the distribution plan (floor plan) for this typology. It appears in the detail panel when selecting the typology on the microsite. Accepted formats: PNG, JPG, PDF. White or transparent background recommended.",
    },
    ubicacionPlano: {
      short: "Image showing the typology's location in the building.",
      long: "Upload an image that shows **where this typology is located** within the tower or project. It can be a floor plan marking the position, or a render with the unit highlighted.",
    },
    hotspots: {
      short: "Interactive points on the typology floor plan.",
      long: "**Hotspots** are clickable areas placed on the floor plan. Each one has a name and description. Use them to highlight spaces like the living room, master bedroom, balcony, etc.",
    },
    pisos: {
      short: "Floor-specific configuration with different renders.",
      long: "If the typology has variations by floor (e.g., floor 1 has a patio, top floor has a terrace), you can define **individual floors** with different renders and plans. Each floor can have its own representative image.",
    },
    caracteristicas: {
      short: "List of features and finishes for the typology.",
      long: "Add tags with the typology's features: finishes, equipment, benefits. Example: **Fitted kitchen, Porcelain flooring, Built-in closets**. These appear as tags on the microsite.",
    },
    torreAsignacion: {
      short: "Groups where this typology is available.",
      long: "Select which **groups** (towers or developments) offer this typology. If the project has a single group, it's assigned automatically. With multiple groups, you can offer the same typology across several groups.",
    },
    extras: {
      short: "Additional special features of the typology.",
      long: "Toggle extras like **jacuzzi, private pool, BBQ, terrace, garden, study**, etc. These extras only appear if enabled at project level in Configuration > Typologies. They are shown as icons on the microsite.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Inventario (Inventory)
     ═══════════════════════════════════════════════════════════════════ */
  inventario: {
    concepto: {
      short: "The inventory contains all individual units in the project.",
      long: "Each **unit** is a specific property (e.g., Apt 301, House 15, Lot 8B). Units inherit characteristics from their typology but can have their own area, price, and status values. The inventory feeds the microsite, quotes, and sales tracking.",
    },
    estado: {
      short: "Availability status of the unit.",
      long: "**Available:** For sale. **Coming Soon:** Not yet on the market. **Held:** Has an interested party but not sold. **Reserved:** Formal purchase commitment. **Sold:** Transaction closed. Status controls which units are shown and how on the microsite.",
    },
    identificador: {
      short: "Unique code or number of the unit within the project.",
      long: "This is the visible identifier (e.g., **301**, **House 15**, **L-08**). Must be unique per project. Shown on the microsite, quotes, and reports. Combined with the unit prefix, it forms the full name.",
    },
    orientacion: {
      short: "Cardinal direction the unit faces.",
      long: "Indicates the main orientation of the unit: North, South, East, West, or intermediate. Affects natural lighting and is a decision factor for buyers. Shown as a filter on the microsite.",
    },
    vista: {
      short: "Type of view the unit has.",
      long: "Describes what can be seen from the unit (e.g., **Ocean view**, **City view**, **Interior**). Views are configured in the Views tab and assigned here. It's an important value factor.",
    },
    smartImport: {
      short: "Bulk import units from an Excel or CSV file.",
      long: "**Smart Import** reads your file and maps columns automatically. Supports Excel (.xlsx) and CSV. Ideal for loading the initial inventory in bulk without entering units one by one.",
    },
    complementos: {
      short: "Parking spots and storage units assignable to units.",
      long: "**Complements** are additional items (parking spots, storage units, warehouses) that can be sold alongside units. Configure the mode: **included** (comes with the unit), **pool** (assigned separately), or **disabled**.",
    },
    precioVenta: {
      short: "Final sale price different from the list price.",
      long: "If the unit sold at a price different from the list price (discount, negotiation), enter the **actual closing price** here. Useful for reports and analysis of sales vs. list price.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Galeria (Gallery)
     ═══════════════════════════════════════════════════════════════════ */
  galeria: {
    concepto: {
      short: "Organize project photos and renders into categories.",
      long: "The microsite gallery is organized into **categories** (e.g., Exteriors, Interiors, Amenities, Finishes). Each category can be project-wide or associated with a tower. Images within each category can be reordered by dragging.",
    },
    categoria: {
      short: "Thematic grouping of images within the gallery.",
      long: "Create categories that represent sections of your gallery. Example: **Exterior renders**, **Common areas**, **Kitchen finishes**. Categories appear as tabs on the microsite. They can be reordered by dragging.",
    },
    torreScope: {
      short: "Associate a gallery category with a specific tower.",
      long: "If the project has multiple towers, you can create **tower-specific galleries**. Categories without an assigned tower are project-wide and appear for the entire project. The tower filter lets visitors see only relevant images.",
    },
    altText: {
      short: "Descriptive image title (accessibility + SEO).",
      long: "Add a title to each image. It's used as **alt text** for accessibility and as a visible caption when opening the lightbox. It also improves SEO for microsite images.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Videos
     ═══════════════════════════════════════════════════════════════════ */
  videos: {
    concepto: {
      short: "Project videos: YouTube or direct upload with streaming.",
      long: "Add videos to the microsite in two ways: pasting a **YouTube URL** or uploading a video file directly. Uploaded videos are cloud-processed with adaptive streaming for the best possible quality.",
    },
    youtubeUrl: {
      short: "Paste the full URL of a YouTube video.",
      long: "Accepts URLs in `youtube.com/watch?v=...` or `youtu.be/...` format. The thumbnail is extracted automatically. The video plays embedded within the microsite without leaving the page.",
    },
    upload: {
      short: "Upload a video file for hosted streaming.",
      long: "Upload MP4, MOV, WebM, or MKV files. The video is cloud-processed with **adaptive streaming** (HLS), meaning quality adjusts automatically to the visitor's internet speed. Processing may take a few minutes.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Tour 360
     ═══════════════════════════════════════════════════════════════════ */
  tour: {
    concepto: {
      short: "360-degree virtual tour of the project or individual typologies.",
      long: "You can add 360 tours in two ways: pasting an **external URL** (Matterport, Kuula, etc.) or uploading tour files directly to NODDO. Tours are displayed as a full-screen iframe on the microsite.",
    },
    urlExterna: {
      short: "URL of a tour hosted on an external platform.",
      long: "Paste the URL or embed code from platforms like **Matterport, Kuula, CloudPano**, etc. NODDO automatically extracts the correct iframe URL. The tour is embedded directly in the microsite.",
    },
    uploadZip: {
      short: "Upload a 360 tour packaged as a ZIP or folder.",
      long: "Upload a **.zip** file or drag the **complete folder** of the exported tour. NODDO uploads all files to the CDN and generates a hosted URL. Ideal for tours exported from tools like 3DVista, Pano2VR, or Krpano.",
    },
    tipologiaTour: {
      short: "Individual tour for a specific typology.",
      long: "In addition to the project-wide tour, you can assign a 360 tour to each typology. Useful when each unit type has its own virtual walkthrough. Accessed from the typology detail on the microsite.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Ubicacion (Location)
     ═══════════════════════════════════════════════════════════════════ */
  ubicacion: {
    coordenadas: {
      short: "Project latitude and longitude for the interactive map.",
      long: "Enter the exact project coordinates. You can do it manually or use the **map picker**. These coordinates center the interactive satellite map on the microsite and enable distance calculations to points of interest.",
    },
    direccion: {
      short: "Physical project address visible on the microsite.",
      long: "Enter the full address (street, number, neighborhood, city). It's displayed as text in the location section of the microsite alongside the interactive map.",
    },
    poi: {
      short: "Points of interest near the project.",
      long: "**POIs** (Points of Interest) are relevant places near the project: shopping centers, hospitals, schools, transit stations, restaurants. They appear as markers on the interactive microsite map with distance and travel time information.",
    },
    poiCategoria: {
      short: "Point of interest category for map filtering.",
      long: "Available categories: **Commerce, Recreation, Health, Education, Transport, Gastronomy, Culture, and Sports**. Microsite visitors can filter POIs by category on the interactive map.",
    },
    poiDistancia: {
      short: "Distance in kilometers from the project to the POI.",
      long: "Calculated automatically if you have project and POI coordinates. Can also be entered manually. Shown on the POI card on the microsite (e.g., **1.2 km**).",
    },
    poiTiempo: {
      short: "Estimated travel time from the project to the POI.",
      long: "Time in minutes by car or walking, depending on distance. Shown alongside the distance on the microsite. Example: **5 min** by car. Can be entered manually or use the automatic suggestion.",
    },
    aiDiscovery: {
      short: "Automatic POI discovery with artificial intelligence.",
      long: "AI automatically searches for relevant places near the project coordinates. You can select categories and search radius. Suggested POIs can be added with a single click.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Vistas (Views)
     ═══════════════════════════════════════════════════════════════════ */
  vistas: {
    concepto: {
      short: "Define the available views from the project and their characteristics.",
      long: "**Views** describe the panorama seen from different project units: ocean view, mountain view, city view, interior, etc. Each view can have an orientation, floor range, representative image, and associated typologies.",
    },
    orientacion: {
      short: "Cardinal direction of the view.",
      long: "Indicates which cardinal point this view faces: **North, South, East, West** or combinations. This helps buyers understand natural lighting and the panorama based on time of day.",
    },
    pisoRango: {
      short: "Floor range from which this view is available.",
      long: "Define the minimum and maximum floor from which this view can be enjoyed. Example: the ocean view may be available **from floor 8**. This helps filter which units have access to each view.",
    },
    imagen: {
      short: "Photo or render of what is seen from this view.",
      long: "Upload an image that represents the actual panorama of this view. It appears on the microsite when the visitor selects a view. Use a **real photo** or a **high-quality panoramic render**.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Fachadas (NODDO Grid)
     ═══════════════════════════════════════════════════════════════════ */
  fachadas: {
    hotspotEditor: {
      short: "Create interactive points on the project facade.",
      long: "**Hotspots** are clickable areas on the facade image. Use them to highlight finishes, common areas, views, or any architectural detail you want to showcase to buyers.",
    },
    concepto: {
      short: "The NODDO Grid is the interactive facade system on the microsite.",
      long: "**Facades** are building or block images on which interactive points (hotspots) are placed to represent units. Visitors click a hotspot to view the unit details, characteristics, and generate a quote.",
    },
    implantacion: {
      short: "Master plan showing the overall project layout.",
      long: "The **site plan** (implantacion) is the master plan showing all towers or blocks from above. Hotspots on the site plan lead to individual facades for each tower or block.",
    },
    fachada: {
      short: "Front image of a tower or block for unit hotspots.",
      long: "Upload a **render or photo of the facade** of the tower. Hotspots representing each unit are placed on this image. Visitors click a hotspot to see price, area, status, and generate a quote.",
    },
    planta: {
      short: "Floor plan view to locate units.",
      long: "The **floor plan** view shows the layout of a floor from above. Hotspots on the plan allow locating each unit within the floor. It complements the facade view.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Recursos (Resources)
     ═══════════════════════════════════════════════════════════════════ */
  recursos: {
    concepto: {
      short: "Downloadable project documents for visitors.",
      long: "**Resources** are PDF files or other documents that microsite visitors can download: brochures, technical sheets, finish lists, floor plans, price lists, etc. They're organized by type and appear in the resources section of the microsite.",
    },
    tipo: {
      short: "Resource category for organization and display.",
      long: "Select the document type: **Brochure, Technical sheet, Finishes, Prices, Plans, Render, Manual, Regulations, Warranties**, or **Other**. The type determines the displayed icon and helps visitors find what they need.",
    },
    brochureUrl: {
      short: "URL of the project's main brochure.",
      long: "If you set up a **Brochure** type resource, it's highlighted as the primary project resource. You can upload a PDF directly or paste the URL of an already-hosted file. It's shown as a prominent button on the microsite.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Avances (Construction Progress)
     ═══════════════════════════════════════════════════════════════════ */
  avances: {
    concepto: {
      short: "Periodic reports on construction progress.",
      long: "**Construction updates** are reports that inform buyers about building progress. Each update has a date, title, rich text description, image, and optional video. They're displayed in chronological order on the microsite.",
    },
    estado: {
      short: "Controls whether the update is visible on the microsite.",
      long: "**Published:** Visible to all microsite visitors. **Draft:** Only visible in the editor, not shown on the microsite. Use draft mode to prepare updates before publishing them.",
    },
    fecha: {
      short: "Date of the construction update.",
      long: "Select the date of the progress report. Updates are **sorted by date** on the microsite, showing the most recent first. Use the actual update date, not the date you enter it in the system.",
    },
    videoUrl: {
      short: "Video URL for the update (YouTube or similar).",
      long: "If you have a construction progress video, paste the **YouTube** URL. The video is embedded alongside the image and description. Ideal for showing walkthroughs of the construction in progress.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     NodDo Quote (existing — preserved unchanged)
     ═══════════════════════════════════════════════════════════════════ */
  cotizador: {
    tipoFase: {
      short: "Defines how the amount for this payment phase is calculated.",
      long: "**Fixed:** Enter a specific amount (e.g. $5,000,000). **Percentage:** Define a % of the unit's total price. **Remainder:** Automatically calculates what's left to pay after other phases.",
    },
    separacionIncluida: {
      short: "Controls whether the reservation fee is deducted from the down payment or added to the total.",
      long: "If **enabled**, the reservation amount is automatically deducted from the down payment. If **disabled**, the reservation is added as an additional payment to the plan.",
    },
    notasLegales: {
      short: "Legal text that appears at the bottom of the quote PDF.",
      long: "Use this field to add disclaimers, terms and conditions, or any legal notes that should appear on all quotes. Example: *Prices subject to change without notice*.",
    },
    moneda: {
      short: "Sets the currency for all project quotes.",
      long: "This currency will be used to format prices in the PDF and on the microsite. It doesn't affect the database, only the display.",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Webhooks (existing — preserved unchanged)
     ═══════════════════════════════════════════════════════════════════ */
  webhooks: {
    secretFirma: {
      short: "Secret key to verify that webhooks come from NODDO.",
      long: "Use this secret on your server to validate the HMAC-SHA256 signature in the `X-Webhook-Signature` header. This ensures the webhook wasn't forged. [See documentation](#).",
    },
    urlWebhook: {
      short: "Your server URL that will receive events via POST.",
      long: "Must be **HTTPS** and publicly accessible. NODDO will send a POST with JSON whenever a selected event occurs (e.g. lead created, quote generated).",
    },
  },

  /* ═══════════════════════════════════════════════════════════════════
     Dominio (existing — preserved unchanged)
     ═══════════════════════════════════════════════════════════════════ */
  dominio: {
    dnsRecords: {
      short: "Configure a CNAME record with your domain provider.",
      long: "Create a **CNAME** record pointing your domain (or subdomain) to `noddo.io`. Verification can take up to 48 hours. Once validated, your microsite will be available on your custom domain.",
    },
  },
};

export default tooltips;
