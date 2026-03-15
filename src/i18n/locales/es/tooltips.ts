const tooltips = {
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
  dominio: {
    dnsRecords: {
      short: "Configura un registro CNAME en tu proveedor de dominios.",
      long: "Crea un registro **CNAME** apuntando tu dominio (o subdominio) a `noddo.io`. La verificación puede tardar hasta 48 horas. Una vez validado, tu micrositio estará disponible en tu dominio personalizado.",
    },
  },
  fachadas: {
    hotspotEditor: {
      short: "Crea puntos interactivos en la fachada del proyecto.",
      long: "Los **hotspots** son áreas clicables sobre la imagen de la fachada. Úsalos para destacar acabados, áreas comunes, vistas, o cualquier detalle arquitectónico que quieras resaltar a los compradores.",
    },
  },
};

export default tooltips;
