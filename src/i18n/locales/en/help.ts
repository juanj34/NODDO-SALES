const help = {
  page: {
    title: "Help Center",
    description:
      "Everything you need to know to create and manage your real estate microsite",
    heroSubtitle:
      "Step-by-step guides for every NODDO feature. Find answers, learn tips, and master the platform.",
    searchPlaceholder: "Search help...",
    noResults: "No results found. Try different terms.",
    ctaTitle: "Didn't find what you were looking for?",
    ctaDescription:
      "Our support team is ready to help you with any questions about the platform.",
    ctaContact: "Contact Us",
    ctaWhatsapp: "Message on WhatsApp",
    stepsLabel: "Step by step",
    tipsLabel: "Tips",
    articlesCount: "{{count}} articles",
  },
  categories: {
    dashboard: "Dashboard",
    proyecto: "Project",
    contenido: "Content",
    ajustes: "Settings",
    flujos: "Workflows",
  },
  categoryDescriptions: {
    dashboard:
      "Projects, team, leads, availability, and analytics",
    proyecto:
      "General settings, towers, and developments",
    contenido:
      "Typologies, inventory, gallery, videos, location, and more",
    ajustes:
      "Configuration, custom domain, and webhooks",
    flujos:
      "Publishing, auto-save, AI, and file management",
  },
  articles: {
    proyectos: {
      title: "Manage Projects",
      description: "Create, edit, delete and manage your real estate microsites",
      content:
        "From the Projects panel you can view all your microsites, create new ones and access each project's editor. Each project represents a complete microsite with its own URL, branding and content.",
      steps: [
        "Click 'New Project' to create a microsite manually. Enter the name and optionally a custom URL slug.",
        "Use 'Create with AI' so the assistant pre-fills data from text, brochures or documents you provide.",
        "Click 'Create Demo' to generate a project with sample data and explore all features risk-free.",
        "Each project card shows its name, developer, status (draft/published/archived) and microsite URL.",
        "Click 'Edit' to open the full project editor, or 'View Site' to open the published microsite.",
        "To delete a project, click the delete icon. You'll need to type the project name to confirm.",
      ],
      tips: [
        "The slug determines your microsite URL (e.g.: my-project.noddo.io). Choose something short and memorable.",
        "A project in 'draft' status is not visible to the public until you publish it from the editor.",
      ],
    },
    equipo: {
      title: "Team & Collaborators",
      description: "Invite collaborators and manage your team's permissions",
      content:
        "The Team section lets you invite up to 3 collaborators who can help update unit availability in the inventory. Collaborators cannot create or delete projects, nor edit other content.",
      steps: [
        "Go to 'Team' from the dashboard sidebar.",
        "Click 'Invite Collaborator' and enter their email. Optionally add their name.",
        "The collaborator will receive an email with a link to create their account and access the platform.",
        "Once they accept, their status will change from 'Pending' to 'Active'.",
        "You can temporarily suspend a collaborator without removing them, or reactivate when needed.",
        "To fully remove a collaborator, use the 'Remove' option and confirm.",
      ],
      tips: [
        "Collaborators can only change unit status (available, reserved, sold). They cannot create or delete units, nor access other editor modules.",
        "The maximum limit is 3 collaborators per admin account.",
      ],
    },
    disponibilidad: {
      title: "Unit Availability",
      description: "Update unit status in real time",
      content:
        "The Availability section lets you quickly update unit status (available, separated, reserved, sold). Changes apply with optimistic updates — they reflect instantly without waiting for server response. Both administrators and collaborators have access to this functionality.",
      steps: [
        "Go to 'Availability' from the dashboard sidebar.",
        "Select the project you want to manage.",
        "Filter units by tower or typology using the selectors at the top.",
        "Click on any unit's status badge to change availability: available (green), separated (yellow), reserved (blue) or sold (red).",
        "Prices display in full format with thousands separators (COP format). Changes save automatically with optimistic updates — you see the result instantly.",
        "You can see a summary with the total units in each status at the top of the page.",
      ],
      tips: [
        "This is the only function collaborators can execute. It's ideal for your sales team to keep inventory updated without needing access to the full editor.",
        "Sold units disappear from the microsite's public view (if 'Hide Sold' is enabled in Settings) but remain visible in the editor and this section.",
        "Status changes sync in real time — if two people are editing simultaneously, they'll see each other's changes immediately.",
        "Changes use optimistic updates: the change appears visually instantly and syncs with the server in the background. If it fails, it reverts automatically.",
      ],
    },
    estadisticas: {
      title: "Statistics & Analytics",
      description: "Complete performance metrics for your microsite",
      content:
        "The Statistics tab within each project's editor offers a complete analytics dashboard: views, unique visitors, lead conversion, device distribution, countries, most visited pages and traffic sources. You can select the time range (7, 30 or 90 days) and export data to CSV. You can also view project storage metrics.",
      steps: [
        "From your project editor, click the 'Statistics' tab.",
        "At the top you'll see 6 main KPIs: total views, unique visitors, total leads, conversion rate, bounce rate and pages per session.",
        "Select the desired time range (7d, 30d, 90d) to update all metrics.",
        "Review the time evolution charts for views, visitors and leads.",
        "In the Distribution section you'll see: devices (desktop/mobile/tablet), most visited pages, main traffic sources (referrers) and visitor countries of origin.",
        "If you have units with configured prices, you'll see financial metrics: total inventory, average value per unit, units sold, total value sold and revenue based on recorded sale prices (precio_venta).",
        "Click 'Export CSV' to download all metrics in Excel format.",
        "In the editor sidebar, below the navigation menu, you'll see a project storage usage indicator with a progress bar and used vs. available space.",
      ],
      tips: [
        "Conversion rate is calculated as: (total leads / unique visitors) × 100.",
        "Data updates in real time. If you don't see data, verify your microsite is published and has received visits.",
        "Financial metrics include actual revenue based on sale prices (precio_venta) recorded when marking units as sold, not just list prices.",
        "Use traffic source data to identify which marketing channels are generating more visits and optimize your advertising investment.",
        "The storage indicator in the sidebar shows how much space your project has used (images, videos, documents, tours). As it approaches the limit, the color changes from gold to yellow to red.",
      ],
    },
    leads: {
      title: "Leads & Contacts",
      description: "View and export contact form submissions",
      content:
        "Every time a visitor fills out the contact form on your microsite, a lead is created and appears in this section. You can search, filter and export your leads for follow-up.",
      steps: [
        "Go to 'Leads' from the sidebar. You'll see a table with all received contacts.",
        "Use the search bar to filter by name or email.",
        "Filter by typology of interest using the dropdown selector.",
        "Click 'Export CSV' to download all leads in Excel format.",
      ],
      tips: [
        "The CSV file includes: name, email, phone, country, typology of interest, message and date. It opens correctly in Excel with accents and special characters.",
        "Leads automatically capture UTM parameters from the visitor's URL, useful for measuring marketing campaigns.",
      ],
    },
    general: {
      title: "Project General",
      description: "Name, landing, developer, colors and SEO configuration",
      content:
        "The General tab contains your project's base configuration, divided into 5 sub-tabs covering everything from basic data to SEO and legal settings.",
      steps: [
        "'Project': Set the project name and slug (URL). Status can be draft, published or archived.",
        "'Landing': Upload the main hero image (project render), logo, optional hero video and write the landing description.",
        "'Developer': Enter your construction company name, upload its logo and add your corporate website link.",
        "'Design': Customize microsite colors — primary (main accent), secondary and background. Changes reflect in real time.",
        "'Advanced': Upload a custom favicon, social sharing image (OG Image, ideally 1200×630px), write legal disclaimer text and privacy policy URL.",
      ],
      tips: [
        "The hero image is the first thing visitors see. Use a high-quality render in landscape format (16:9).",
        "The primary color is used for buttons, accents and interactive elements throughout the microsite. Choose a tone that represents your brand.",
        "The OG image appears when sharing your microsite link on WhatsApp, Facebook, Twitter and LinkedIn.",
        "The project type (towers, development, hybrid, lots) is configured from the 'Settings' tab, where you can also customize inventory columns.",
      ],
    },
    torres: {
      title: "Towers & Developments",
      description: "Manage buildings, floor composition and amenities",
      content:
        "If your project has multiple buildings or phases, you can create multiple towers. Each tower has its own info, floor composition, amenities, facades and units. You can also use the 'Development' type for houses or horizontal complexes.",
      steps: [
        "Click 'Add Tower' and select the type: Tower (vertical building) or Development (horizontal complex).",
        "Assign a name and prefix (T1, U1, etc.) used to identify units.",
        "In the 'Info' tab configure the building composition: basements, ground floor, podiums, residential floors and rooftop. A visual bar shows the proportions.",
        "In the 'Amenities' tab select available amenities from the catalog (pool, gym, social lounge, etc.) or add custom ones.",
        "Upload a cover image and specific logo for each tower.",
        "For single-tower projects, you don't need to create towers — the system works automatically.",
      ],
      tips: [
        "Floor composition is used to visualize the building layout in the microsite. Make sure the numbers are accurate.",
        "If you disable multi-tower mode, only the first tower is kept and others are deleted.",
        "Amenities appear as interactive icons in the microsite's explore section.",
      ],
    },
    tipologias: {
      title: "Typologies",
      description: "Property types with specs, floor plans, hotspots and linked video",
      content:
        "Typologies represent the property types in your project (1-bed apt, 2-bed apt, corner house, etc.). Each typology has its specs, plans and can be assigned to one or more towers. You can assign a property type (apartment, house, lot) and link a project video.",
      steps: [
        "Click '+' to create a new typology. Give it a descriptive name.",
        "In 'General' write the description, features (as comma-separated tags: balcony, exterior view, high floor) and assign towers where available.",
        "In 'Specs' enter: internal area (m²), balcony area, built area, private area and lot area (depending on project configuration), plus bedrooms, bathrooms and parking. Total area is calculated automatically.",
        "Select the typology's property type: apartment, house or lot. This type determines which inventory columns display for units of this typology.",
        "If your project has videos configured, you can link a video to the typology. Microsite visitors will see a 'Watch Video' button that opens the associated video.",
        "In 'Floor Plan' upload the architectural plan image and optionally the location within the project plan.",
        "In 'Hotspots' add interactive points on the plan. Visitors can click them to see details or renders.",
        "Use 'Clone to Tower' to copy a typology to another building in one click.",
      ],
      tips: [
        "Price is automatically calculated from the cheapest available unit in inventory. No need to enter it manually.",
        "Hotspots require a floor plan image first. They appear as golden dots visitors can explore.",
        "With multiple towers, you can filter typologies by tower using the top tabs.",
        "Available area fields (built, private, lot) depend on the project configuration. You can enable or disable them from the Settings tab.",
        "When linking a video, only processed and ready videos appear. Videos still being uploaded won't show in the list.",
      ],
    },
    inventario: {
      title: "Unit Inventory",
      description: "Unit management, custom columns, sale price, AI and bulk operations",
      content:
        "The inventory contains all individual units in your project (apartments, houses, commercial spaces). Each unit has a unique identifier, assigned typology, and an availability status. Visible columns are configurable by project type, and you can add custom columns.",
      steps: [
        "Click '+' to add a unit. Assign an identifier (e.g.: 101, 1001A), select typology, floor, area, price and status.",
        "To import many units, use 'Import CSV'. Download the template, fill in data in Excel and upload it.",
        "Use the AI assistant to extract unit data: paste text from any source or attach files (brochures, PDFs, tables). The assistant opens in a side panel where you can interact via chat, review extracted data and confirm the import.",
        "Change a unit's status by clicking its status badge: available (green), separated (yellow), reserved (blue) or sold (red). Changes apply instantly with optimistic updates.",
        "When a unit is marked as 'sold', you can record the actual sale price (precio_venta). This price is automatically locked and used for financial metrics.",
        "For bulk operations, select multiple units with checkboxes and change their status or delete them at once.",
        "Visible inventory columns are configured from the 'Settings' tab. You can choose which columns to show in the editor and which on the public microsite.",
        "Create custom columns from the inventory settings button. Custom columns can be text, number or select type, and display in the editor and optionally on the microsite.",
        "Export the complete inventory to CSV with the 'Export' button.",
      ],
      tips: [
        "Collaborators can only change unit status, not create or delete. Ideal for your sales team to update availability in real time.",
        "The AI assistant accepts file attachments (brochure images, PDFs, tables). Use the chat to refine extracted data before importing.",
        "Statuses reflect immediately on the public microsite. Updates are optimistic — you see the change instantly without waiting for server response.",
        "The sale price (precio_venta) only appears for sold units. It's automatically recorded when changing status to sold and cannot be modified afterward.",
        "You can configure a display prefix for units (e.g.: 'Apt', 'House', 'Lot') from the Settings tab. This prefix appears before the identifier on the microsite.",
      ],
    },
    cotizador: {
      title: "Quotation & Simulator",
      description: "Configure payment phases, discounts and interactive simulator",
      content:
        "The quotation tool lets you configure a financing simulator that microsite visitors can use to calculate installments and payment plans. You define phases (reservation, down payment, on delivery), applicable discounts and legal notes. The simulator generates downloadable PDFs with personalized payment plans.",
      steps: [
        "In the editor, go to the 'Quotation' tab.",
        "Select your project currency (COP, USD, MXN).",
        "Configure payment phases: each phase can be 'fixed' (currency amount), 'percentage' (% of unit price) or 'remainder' (remaining balance).",
        "For each phase define: name, type, value, number of installments and frequency (one-time, monthly, bi-monthly, quarterly).",
        "Reorder phases by dragging. The order determines how the simulator calculates.",
        "Activate 'Reservation included in down payment' if you want the reservation amount deducted from the down payment.",
        "Optionally add discounts: you can create early payment, early bird, launch discounts, etc. Each discount has a percentage and can apply to base price or a specific phase.",
        "Write legal notes that will appear in the quotation PDF (conditions, interest rate, policies, etc.).",
        "Use the interactive preview to test the simulator before publishing.",
      ],
      tips: [
        "The simulator is a powerful conversion tool — visitors who generate a quotation are highly qualified leads.",
        "Generated quotations are automatically saved in the dashboard's 'Quotations' section, where you can view complete history and download PDFs.",
        "If you change quotation settings, previous quotations are NOT updated — they're preserved with the settings they had when generated.",
        "The simulator only appears on the microsite if you have at least one unit with configured price in inventory.",
      ],
    },
    fachadas: {
      title: "Noddo Grid (Facades)",
      description: "Building facade renders with interactive hotspots and unit labels",
      content:
        "The Noddo Grid lets you upload building facade images and place interactive hotspots that visitors can explore. Each hotspot can link to a typology or show additional information. Units are displayed with labels on the grid.",
      steps: [
        "Click '+' to create a new facade. Name it and optionally assign to a tower.",
        "Upload the building facade render image.",
        "Click anywhere on the image to add a hotspot. Assign a name and optionally link to a typology.",
        "Drag hotspots to reposition them on the image.",
        "To rename a facade, click directly on its name in the list. The name edits inline without opening a form.",
        "Use 'Duplicate Hotspots' to copy points from one facade to another (useful for similar layouts).",
      ],
      tips: [
        "Use high-quality renders with good resolution. The image displays fullscreen in the microsite.",
        "Hotspots appear as glowing golden dots visitors can explore in the microsite's 'Explore' section.",
        "Each hotspot displays the corresponding unit label on the grid, making visual identification easier.",
        "The save indicator shows current status (saving, saved) so you always know if your changes have been persisted.",
      ],
    },
    planos: {
      title: "Site Plans",
      description: "Project plans with interactive points",
      content:
        "Site plans are general project layouts (urbanization plan, complex distribution) where you can place interactive points linking to towers, common areas or amenities.",
      steps: [
        "Create a new plan and upload the general layout image.",
        "Click on the image to add points. Each point can have a name, description and icon.",
        "Optionally link each point to an existing typology for direct visitor navigation.",
        "Reorder points by dragging them in the list.",
      ],
      tips: [
        "Use clear, high-resolution plans. Rendered architectural plans work better than scans.",
        "Site plans are especially useful for development projects (houses) where spatial layout is key.",
      ],
    },
    galeria: {
      title: "Image Gallery",
      description: "Categories, batch upload, crop and reordering",
      content:
        "The gallery lets you organize project images into categories (Facade, Interiors, Common Areas, Renders, etc.). Visitors browse between categories with a fullscreen slider.",
      steps: [
        "Create a category by clicking '+'. Give it a descriptive name (e.g.: Renders, Interiors, Amenities).",
        "Select a category and click 'Upload Images' to add photos. You can select multiple files at once.",
        "When uploading, you can crop each image by selecting the desired aspect ratio.",
        "Reorder categories by dragging them in the tab bar.",
        "Reorder images within each category by dragging them in the grid.",
        "Delete individual images with the delete button on each one.",
      ],
      tips: [
        "Images are automatically optimized when uploaded (WebP format, max 1920px width). No need to compress beforehand.",
        "We recommend at least 3-5 images per category for a good gallery experience.",
        "Category order determines the display order in the microsite.",
      ],
    },
    videos: {
      title: "Videos",
      description: "YouTube videos and hosted videos with drag-and-drop",
      content:
        "Add videos to your project in two ways: paste a YouTube URL or upload a video file directly to be hosted on NODDO. Videos display in a fullscreen player in the microsite.",
      steps: [
        "Click '+' to add a video. Choose between 'URL' to paste a YouTube link, or 'Upload' to upload a video file directly.",
        "If you choose URL: paste the YouTube URL and the system will automatically extract the title and thumbnail.",
        "If you choose Upload: select a video file (MP4, WebM). The video will be uploaded and processed automatically. You'll see a progress indicator and processing status.",
        "Edit the video title if you want to customize it.",
        "Reorder videos by dragging them in the list. The first one plays by default.",
        "Delete a video with the delete button.",
      ],
      tips: [
        "Use unlisted YouTube videos if you don't want them in public search results but do want them on your microsite.",
        "The first video in the list is shown when entering the microsite's Videos section.",
        "Uploaded videos are processed in the cloud. While processing, you'll see a status indicator. Once ready, they play directly without depending on YouTube.",
        "The video upload feature (video hosting) may require activation on your plan. If you don't see the option, contact support.",
      ],
    },
    tour: {
      title: "360 Tour",
      description:
        "Immersive virtual tour with Matterport or self-hosted files",
      content:
        "The 360 Tour tab lets you set up an immersive virtual tour for your project. You can paste a Matterport URL or upload your own tour (ZIP or folder) to be hosted directly on NODDO. The tour displays as a fullscreen section in the microsite.",
      steps: [
        "Go to the '360 Tour' tab in your project editor.",
        "Choose between two options: 'URL' to paste a Matterport or other provider link, or 'Upload' to host the tour directly on NODDO.",
        "If you choose URL: paste the tour address (e.g.: https://my.matterport.com/show/?m=...). The system automatically extracts the embeddable URL even if you paste a full link or iframe code.",
        "If you choose Upload: drag a ZIP file or select a folder with tour files. You can also use the 'Select Folder' button to choose the folder directly.",
        "Upload progress is shown in a progress bar with the count of uploaded files. You can cancel the upload at any time.",
        "When the upload completes, the tour is hosted on NODDO's infrastructure and configured automatically.",
        "A tour preview appears at the bottom of the section, with a link to open it in a new tab.",
        "To replace a hosted tour, use the 'Replace' button. To remove it, use 'Delete Tour'.",
      ],
      tips: [
        "Tour file upload works in the background — you can navigate to other editor tabs while it completes. A floating indicator will show you the progress.",
        "If you close or navigate away from the editor during an active upload, the system will warn you to prevent losing progress.",
        "Tours hosted on NODDO load faster for visitors than third-party embeds, as they're served from our CDN.",
        "Supported upload formats: ZIP file or folder containing tour files (HTML, JS, CSS, assets).",
      ],
    },
    ubicacion: {
      title: "Location & Map",
      description: "Interactive map, points of interest and AI discovery",
      content:
        "Set your project's location on the map and add nearby points of interest (POIs) like schools, malls, hospitals and transport. Visitors see an interactive satellite map with all points.",
      steps: [
        "In the 'Location' tab enter the address, latitude and longitude. Use the map picker to pinpoint the exact location.",
        "In the 'POIs' tab click '+' to add points of interest manually. Select the category (Commerce, Recreation, Health, Education, Transport, Dining, Culture, Sports).",
        "Enter name, description, coordinates (use map picker), and optionally upload a photo.",
        "Distance and travel time are calculated automatically based on coordinates.",
        "Use 'Discover POIs' for AI to automatically find nearby places of interest. Review results and select which to add.",
      ],
      tips: [
        "POIs appear as white dots on the satellite map. Clicking shows a panel with photo, name, distance and travel time.",
        "AI discovery works best when the project address and coordinates are correct.",
        "Categories have specific icons to help visitors quickly identify each type of place.",
      ],
    },
    vistas: {
      title: "Floor Views",
      description:
        "Define views by orientation and floor range with automatic assignment",
      content:
        "Floor Views let you configure available sight lines in your project by orientation, floor range and typology. Inventory units are automatically assigned to their corresponding views based on their floor and typology.",
      steps: [
        "Go to the 'Views' tab in your project editor.",
        "Click 'New View' to create a view. Give it a descriptive name (e.g.: Park View, North City View).",
        "Select the view orientation (North, South, East, West, etc.) using the field suggestions or typing a custom one.",
        "Define the floor range where this view applies: minimum floor and maximum floor.",
        "If you have multiple towers, assign the view to a specific tower or leave it as general for all.",
        "Select the typologies that have this view available using the multi-select checkboxes.",
        "Upload a representative image of the view (render or actual photo). The image displays as a card in the views grid.",
        "Optionally add a view description.",
        "When saved, inventory units matching the tower, floor range and typology will be automatically assigned to this view. The system will show you how many units were assigned.",
      ],
      tips: [
        "Views are automatically assigned to inventory units. No need to manually assign each unit — the system does it based on floor and typology.",
        "The 'Assignment Summary' section shows a table with all units and their assigned view, useful for verifying the configuration is correct.",
        "If your project has multiple towers, you can filter views by tower using the top tabs.",
        "View images appear on cards with orientation info, floor range and assigned unit count.",
      ],
    },
    recursos: {
      title: "Resources & Documents",
      description: "Brochures with integrated PDF viewer, spec sheets and downloadable documents",
      content:
        "Upload documents that microsite visitors can download or view: sales brochures, spec sheets, price lists, finish specifications, etc. PDF brochures can be viewed directly in the browser with an integrated viewer.",
      steps: [
        "Click '+' to add a new resource.",
        "Select the resource type: Brochure, Finishes, Spec Sheet, Prices or Other.",
        "Upload the file (PDF recommended) and give it a descriptive name.",
        "Resources appear as downloadable cards in the microsite's 'Resources' section.",
        "PDF brochures open in an integrated viewer with page navigation, zoom and direct download. Visitors can browse the brochure without leaving the microsite.",
      ],
      tips: [
        "PDF brochures display inline on the microsite with an interactive viewer supporting page navigation and zoom. Visitors don't need to download the file to view it.",
        "Keep files lightweight (under 10MB) for fast downloads and smooth PDF viewer performance.",
        "Non-PDF formats will download on click.",
      ],
    },
    avances: {
      title: "Construction Progress",
      description: "Construction progress timeline with photos and videos",
      content:
        "Document your project's construction progress with photos, videos and descriptions. Visitors see a chronological timeline in the microsite.",
      steps: [
        "Click '+' to create a new progress entry.",
        "Add a title, description, date and upload photos of the current construction state.",
        "Optionally add a YouTube video link.",
        "Progress entries are ordered chronologically (newest first) in the microsite.",
        "Reorder entries if you need to adjust the order.",
      ],
      tips: [
        "Publishing regular updates builds buyer confidence and maintains project interest.",
        "Use quality photos that clearly show construction progress.",
      ],
    },
    config: {
      title: "General Settings",
      description: "Project type, inventory columns, WhatsApp, display and microsite options",
      content:
        "The Settings tab contains options controlling your project structure, inventory columns, special microsite features and display options.",
      steps: [
        "'Project Type': Select your project type: Towers (vertical buildings), Development (houses/horizontal complexes), Hybrid (mixed types) or Lots. The type determines available inventory columns and system behavior.",
        "'Inventory Columns': Customize which fields display in the inventory table in the editor and microsite. You can enable/disable columns like built area, private area, lot area, orientation, view, floor, etc.",
        "'WhatsApp': Enter the WhatsApp number with country code (e.g.: 573001234567). A floating button will appear on the microsite.",
        "'Unit Prefix': Configure a prefix displayed before each unit's identifier on the microsite (e.g.: 'Apt', 'House', 'Lot').",
        "'Hide Sold': Enable this toggle so sold units don't appear on the public microsite. They'll still be visible in the editor.",
        "'Hide Sold Price': Enable this toggle to hide the price of units marked as sold on the microsite.",
        "'Stage Label': Customize how the towers/stages section is named (default: 'Grid').",
        "'Hide NODDO Badge': Disable the 'Powered by NODDO' seal in the microsite corner.",
        "'Ambient Audio': Upload an audio file (MP3, WAV) that plays in the background. Visitors can mute it.",
      ],
      tips: [
        "Project type automatically affects available columns. For hybrid projects, you can configure different columns for each typology type (apartment, house, lot).",
        "The WhatsApp button is the most effective way to receive contacts. Make sure the number is correct and active.",
        "Ambient audio starts muted by default. Visitors must activate it manually.",
        "The 'Hide Sold' option is useful when you don't want to show visitors units that have already been sold.",
      ],
    },
    dominio: {
      title: "Custom Domain",
      description: "Set up a custom domain for your microsite",
      content:
        "By default, your microsite is available on a NODDO subdomain (your-project.noddo.io). You can connect a custom domain for a more professional experience.",
      steps: [
        "In the 'Domain' tab you'll see your current subdomain (slug.noddo.io).",
        "To connect a custom domain, enter the full domain (e.g.: www.myproject.com).",
        "The system will show DNS records to configure with your domain provider.",
        "Once DNS is configured, click 'Verify' to confirm the domain is pointing correctly.",
        "When verification succeeds, your microsite will be available at both URLs (subdomain + custom domain).",
      ],
      tips: [
        "DNS propagation can take up to 48 hours, though it usually completes in less than 1 hour.",
        "SSL certificate is generated automatically once the domain is verified.",
      ],
    },
    webhooks: {
      title: "Webhooks & Integrations",
      description: "Connect NODDO with your external systems via webhooks",
      content:
        "Webhooks allow you to integrate NODDO with your external systems (CRM, automations, databases). When an event occurs on your microsite (new lead, quotation generated), NODDO automatically sends data to a URL you configure. This lets you sync information in real time without manual intervention.",
      steps: [
        "In the editor, go to the 'Webhooks' tab.",
        "Activate webhooks with the toggle at the top.",
        "Enter your endpoint URL (must be HTTPS). NODDO will send POST requests to this URL whenever an event occurs.",
        "Select the events you want to receive: 'lead.created' (new lead from contact form) and/or 'cotizacion.created' (new quotation from simulator).",
        "Copy the secret (secret key) that NODDO automatically generates. Use it on your server to verify requests really come from NODDO via HMAC-SHA256 signature.",
        "Click 'Save' to activate the configuration.",
        "Use the 'Send Test' button to verify your endpoint is receiving correctly. NODDO will send a test payload.",
        "Review delivery history in the logs table: you'll see each request sent, its status (success/failure), HTTP response code and timestamp.",
        "Click 'Retry' on any failed log to resend the payload.",
      ],
      tips: [
        "Your endpoint must respond with HTTP 200-299 code in less than 10 seconds. If it doesn't respond in time or returns an error, NODDO will automatically retry up to 3 times with exponential backoff.",
        "The secret is used to generate an HMAC-SHA256 signature of the payload sent in the `X-NODDO-Signature` header. Verify this signature on your server to ensure the request is authentic and wasn't tampered with.",
        "Webhooks are ideal for integrating with CRMs like HubSpot, Salesforce, Pipedrive, GoHighLevel, or automations in Make.com, Zapier, n8n.",
        "The payload includes all event data: for leads includes name, email, phone, message, typology of interest, UTMs; for quotations includes client data, selected unit, complete payment plan and PDF URL.",
        "If you disable webhooks, requests will stop being sent but the log history is preserved.",
      ],
    },
    publicacion: {
      title: "Publishing & Versions",
      description: "Publish, unpublish, archive and restore microsite versions",
      content:
        "The publishing system lets you control when and where changes become visible to the public. You can choose publish destinations (NODDO subdomain and/or custom domain), archive or unarchive the project, and unpublish if you need to temporarily take the site down.",
      steps: [
        "When you make changes in the editor, the status indicator will show 'Unpublished changes' (orange).",
        "Click 'Publish' in the editor's top bar. A menu will open where you can select publish destinations: NODDO subdomain and/or custom domain (if configured).",
        "Check or uncheck destinations and click 'Publish Now' to make changes visible.",
        "A new version (v1, v2, v3...) is created with a complete copy of all content.",
        "To view version history, click the dropdown button (arrow) next to the publish button.",
        "To restore a previous version, click 'Restore' next to the desired version. A new version is created with the restored content.",
        "To unpublish the microsite (take it offline without deleting it), use the 'Unpublish' option in the versions menu. The project will return to draft status.",
        "To archive or unarchive the project, use the 'Archive Project' / 'Unarchive Project' option at the bottom of the versions menu.",
      ],
      tips: [
        "Project status shows in 3 colors: amber (draft, never published), green (published and up to date), orange (published but with pending changes).",
        "Restoring a version doesn't delete later versions — a new version is created with old content, so you never lose data.",
        "Changes auto-save in the editor but are NOT public until you press 'Publish'.",
        "Unpublishing takes the microsite offline but preserves all content and versions. You can republish at any time.",
        "The destination selector lets you publish to NODDO subdomain only, your custom domain only, or both.",
      ],
    },
    autoguardado: {
      title: "Auto-Save",
      description: "How automatic saving works",
      content:
        "NODDO automatically saves all your changes while editing. No need to press a save button — your changes are preserved even if you close the browser.",
      steps: [
        "When you modify any field in the editor, a 1.5-second timer activates.",
        "When it completes, data is sent to the server. You'll see a 'Saving...' indicator followed by 'Saved'.",
        "If you switch tabs or close the page before saving completes, the system automatically saves pending changes.",
        "Saved changes are private until you publish the project.",
      ],
      tips: [
        "Auto-save works across all editor tabs: General, Towers, Typologies, etc.",
        "If the save indicator doesn't change to 'Saved', check your internet connection.",
        "Remember: save ≠ publish. Changes save to your account but aren't visible to the public until you publish.",
      ],
    },
    iaCreacion: {
      title: "AI-Powered Creation",
      description: "Create a complete project from text or documents",
      content:
        "The AI assistant lets you create a complete project in minutes. Just provide information about your real estate project — from loose text to complete brochures — and the system extracts all data automatically.",
      steps: [
        "Click 'Create with AI' from the projects panel.",
        "In the chat, describe your project: name, developer, location, typologies, prices, features, etc.",
        "You can also upload files (brochure images, PDFs, spec sheets) for the AI to extract information.",
        "In the right panel you'll see extracted data, including name, colors, typologies and overall progress.",
        "If the AI needs more info, it shows pending questions in the panel. Answer them in the chat.",
        "When data is complete (or at least you have the project name), click 'Create Project'.",
        "The system automatically creates the project with all extracted typologies, colors and settings.",
      ],
      tips: [
        "The more information you give the AI, the more complete the created project. But you can start with just the name.",
        "You can upload printed brochure images — AI can read text from images.",
        "After creating the project, you can edit and adjust any data from the normal editor.",
      ],
    },
    archivos: {
      title: "File Uploads",
      description: "Supported formats, maximum sizes and optimization",
      content:
        "NODDO supports uploading images, videos and documents. Images are automatically optimized when uploaded to ensure fast loading times on the microsite.",
      steps: [
        "Drag and drop files into any upload zone, or click to select from your computer.",
        "Images are automatically converted to WebP format with a max width of 1920px and 80% quality. A 400px thumbnail is also generated.",
        "Supported image formats: JPEG, PNG, WebP, GIF, AVIF, TIFF and BMP. Maximum size: 10MB.",
        "Supported video formats: MP4 and WebM. Maximum size: 50MB.",
        "Supported audio formats: MP3, WAV, OGG and M4A. Maximum size: 15MB.",
        "When uploading images, use the crop tool to adjust the ratio (16:9, square, logo, etc.).",
      ],
      tips: [
        "No need to optimize images before uploading — the system does it automatically.",
        "For large videos, the browser compresses them client-side before uploading.",
        "If an image looks blurry on the microsite, try uploading a higher resolution version (minimum 1920px width for hero renders).",
      ],
    },
  },
} as const;

export default help;
