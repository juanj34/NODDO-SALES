const tooltips = {
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
  dominio: {
    dnsRecords: {
      short: "Configure a CNAME record with your domain provider.",
      long: "Create a **CNAME** record pointing your domain (or subdomain) to `noddo.io`. Verification can take up to 48 hours. Once validated, your microsite will be available on your custom domain.",
    },
  },
  fachadas: {
    hotspotEditor: {
      short: "Create interactive points on the project facade.",
      long: "**Hotspots** are clickable areas on the facade image. Use them to highlight finishes, common areas, views, or any architectural detail you want to showcase to buyers.",
    },
  },
};

export default tooltips;
