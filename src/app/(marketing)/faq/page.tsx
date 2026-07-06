"use client";

import { HelpCircle, ChevronDown, Mail } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePageView } from "@/hooks/usePageView";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* ══════════════════════════════════════════════
   KNOWLEDGE SEARCH TERMINAL — Complex animated hero SVG
   Search terminal with input bar, result cards,
   conversation bubbles, category tree, magnifying glass
══════════════════════════════════════════════ */
function KnowledgeSearchIllustration() {
  return (
    <svg viewBox="0 0 320 180" fill="none" className="w-full" style={{ maxWidth: 420 }}>
      <defs>
        <linearGradient id="fq-panel" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.05)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.015)" />
        </linearGradient>
        <linearGradient id="fq-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(184,151,58,0.04)" />
          <stop offset="100%" stopColor="rgba(184,151,58,0.01)" />
        </linearGradient>
      </defs>
      <style>{`
        .fq-cursor { animation: fq-blink 1s step-end infinite; }
        .fq-text-draw { stroke-dasharray: 80; stroke-dashoffset: 80; animation: fq-type 3s ease-in-out infinite; }
        .fq-card-expand { animation: fq-expand 6s ease-in-out infinite; }
        .fq-bubble1 { animation: fq-float-up 5s ease-in-out infinite; }
        .fq-bubble2 { animation: fq-pulse-gold 3s ease-in-out infinite 0.5s; }
        .fq-bubble3 { animation: fq-float-up 5.5s ease-in-out infinite 1s; }
        .fq-connect { stroke-dasharray: 3 3; animation: fq-flow 2s linear infinite; }
        .fq-branch1 { animation: fq-branch-pulse 4s ease-in-out infinite; }
        .fq-branch2 { animation: fq-branch-pulse 4s ease-in-out infinite 1.3s; }
        .fq-branch3 { animation: fq-branch-pulse 4s ease-in-out infinite 2.6s; }
        .fq-q1 { animation: fq-q-drift 6s ease-in-out infinite; }
        .fq-q2 { animation: fq-q-drift 7s ease-in-out infinite 1s; }
        .fq-q3 { animation: fq-q-drift 5.5s ease-in-out infinite 2s; }
        .fq-q4 { animation: fq-q-drift 6.5s ease-in-out infinite 0.5s; }
        .fq-q5 { animation: fq-q-drift 8s ease-in-out infinite 1.5s; }
        .fq-mag { animation: fq-scan 8s ease-in-out infinite; }
        .fq-dust1 { animation: fq-dust 5s ease-in-out infinite; }
        .fq-dust2 { animation: fq-dust 6s ease-in-out infinite 0.8s; }
        .fq-dust3 { animation: fq-dust 5.5s ease-in-out infinite 1.5s; }
        .fq-dust4 { animation: fq-dust 7s ease-in-out infinite 0.4s; }
        .fq-dust5 { animation: fq-dust 4.5s ease-in-out infinite 2s; }
        .fq-dust6 { animation: fq-dust 6.5s ease-in-out infinite 1.2s; }
        .fq-glow { animation: fq-glow-pulse 3s ease-in-out infinite; }
        .fq-highlight { animation: fq-hl 4s ease-in-out infinite; }
        @keyframes fq-blink { 0%,49%{opacity:0.3} 50%,100%{opacity:0} }
        @keyframes fq-type { 0%{stroke-dashoffset:80} 40%{stroke-dashoffset:0} 60%{stroke-dashoffset:0} 100%{stroke-dashoffset:-80} }
        @keyframes fq-expand { 0%,30%{transform:scaleY(1);opacity:1} 40%,60%{transform:scaleY(1.8);opacity:1} 70%,100%{transform:scaleY(1);opacity:1} }
        @keyframes fq-float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes fq-pulse-gold { 0%,100%{opacity:0.2} 50%{opacity:0.5} }
        @keyframes fq-flow { from{stroke-dashoffset:0} to{stroke-dashoffset:-8} }
        @keyframes fq-branch-pulse { 0%,100%{opacity:0.12} 50%{opacity:0.3} }
        @keyframes fq-q-drift { 0%,100%{transform:translateY(0);opacity:0.15} 50%{transform:translateY(-10px);opacity:0.04} }
        @keyframes fq-scan { 0%,100%{transform:translateX(0)} 50%{transform:translateX(8px)} }
        @keyframes fq-dust { 0%,100%{transform:translateY(0);opacity:1} 50%{transform:translateY(-8px);opacity:0.3} }
        @keyframes fq-glow-pulse { 0%,100%{opacity:0.04} 50%{opacity:0.12} }
        @keyframes fq-hl { 0%,100%{opacity:0.08} 50%{opacity:0.18} }
      `}</style>

      {/* Background glow */}
      <circle className="fq-glow" cx="130" cy="90" r="60" fill="rgba(184,151,58,0.06)" />

      {/* ── MAIN TERMINAL PANEL ── */}
      <rect x="40" y="8" width="175" height="164" rx="4" stroke="rgba(184,151,58,0.15)" strokeWidth="0.7" fill="url(#fq-panel)" />
      {/* Title bar */}
      <rect x="40" y="8" width="175" height="14" rx="4" fill="rgba(184,151,58,0.035)" />
      <line x1="40" y1="22" x2="215" y2="22" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
      <circle cx="50" cy="15" r="2" fill="rgba(184,151,58,0.15)" />
      <circle cx="57" cy="15" r="2" fill="rgba(184,151,58,0.1)" />
      <circle cx="64" cy="15" r="2" fill="rgba(184,151,58,0.08)" />
      <text x="127" y="17" textAnchor="middle" fill="rgba(184,151,58,0.15)" fontSize="4" fontFamily="monospace">BASE DE CONOCIMIENTO</text>

      {/* ── SEARCH INPUT BAR ── */}
      <rect x="50" y="28" width="155" height="14" rx="3" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" />
      {/* Search icon */}
      <circle cx="58" cy="35" r="3.5" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" fill="none" />
      <line x1="60.5" y1="37.5" x2="63" y2="40" stroke="rgba(184,151,58,0.2)" strokeWidth="0.5" />
      {/* Typing text animation */}
      <line className="fq-text-draw" x1="66" y1="35" x2="140" y2="35" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" strokeLinecap="round" />
      {/* Blinking cursor */}
      <rect className="fq-cursor" x="142" y="31" width="1" height="8" rx="0.5" fill="rgba(184,151,58,0.3)" />

      {/* ── RESULT CARDS ── */}
      {/* Card 1 — Collapsed */}
      <rect x="50" y="48" width="155" height="16" rx="2" fill="url(#fq-card)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
      <rect x="56" y="53" width="60" height="2.5" rx="0.5" fill="rgba(184,151,58,0.06)" />
      <rect x="56" y="58" width="45" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />
      {/* Chevron */}
      <path d="M195 54 L198 57 L201 54" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="none" />

      {/* Card 2 — Expanded (highlighted, animated) */}
      <g className="fq-card-expand" style={{ transformOrigin: "127px 80px" }}>
        <rect className="fq-highlight" x="50" y="68" width="155" height="30" rx="2" fill="url(#fq-card)" stroke="rgba(184,151,58,0.18)" strokeWidth="0.6" />
        <rect x="56" y="73" width="70" height="2.5" rx="0.5" fill="rgba(184,151,58,0.08)" />
        {/* Answer text lines */}
        <rect x="56" y="79" width="140" height="2" rx="0.5" fill="rgba(184,151,58,0.05)" />
        <rect x="56" y="83" width="130" height="2" rx="0.5" fill="rgba(184,151,58,0.04)" />
        <rect x="56" y="87" width="120" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />
      </g>
      {/* Chevron rotated */}
      <path d="M195 78 L198 75 L201 78" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" fill="none" />
      {/* Active dot */}
      <circle cx="52" cy="73" r="1.5" fill="rgba(184,151,58,0.2)" />

      {/* Card 3 — Collapsed */}
      <rect x="50" y="103" width="155" height="16" rx="2" fill="url(#fq-card)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
      <rect x="56" y="108" width="55" height="2.5" rx="0.5" fill="rgba(184,151,58,0.06)" />
      <rect x="56" y="113" width="40" height="2" rx="0.5" fill="rgba(184,151,58,0.03)" />
      <path d="M195 109 L198 112 L201 109" stroke="rgba(184,151,58,0.12)" strokeWidth="0.5" fill="none" />

      {/* Card 4 — Collapsed */}
      <rect x="50" y="123" width="155" height="16" rx="2" fill="url(#fq-card)" stroke="rgba(184,151,58,0.06)" strokeWidth="0.4" />
      <rect x="56" y="128" width="65" height="2.5" rx="0.5" fill="rgba(184,151,58,0.05)" />
      <rect x="56" y="133" width="48" height="2" rx="0.5" fill="rgba(184,151,58,0.025)" />

      {/* Results count */}
      <text x="50" y="153" fill="rgba(184,151,58,0.1)" fontSize="3" fontFamily="monospace">Mostrando 4 de 42 resultados</text>
      {/* Pagination dots */}
      <circle cx="50" cy="162" r="2" fill="rgba(184,151,58,0.15)" />
      <circle cx="57" cy="162" r="2" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
      <circle cx="64" cy="162" r="2" fill="rgba(184,151,58,0.06)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />

      {/* ── LEFT: CONVERSATION BUBBLES ── */}
      {/* Bubble 1 — Question (left aligned) */}
      <g className="fq-bubble1">
        <rect x="4" y="35" width="28" height="14" rx="3" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <text x="18" y="44" textAnchor="middle" fill="rgba(184,151,58,0.2)" fontSize="8" fontFamily="serif">?</text>
        {/* Tail */}
        <path d="M8 49 L4 54 L12 49" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
      </g>

      {/* Bubble 2 — Answer (right aligned, gold pulse) */}
      <g className="fq-bubble2">
        <rect x="8" y="60" width="24" height="12" rx="3" fill="rgba(184,151,58,0.05)" stroke="rgba(184,151,58,0.18)" strokeWidth="0.4" />
        <path d="M19 68 L21 71 L25 65" stroke="rgba(184,151,58,0.3)" strokeWidth="0.7" fill="none" strokeLinecap="round" />
        {/* Tail */}
        <path d="M28 72 L32 76 L24 72" fill="rgba(184,151,58,0.05)" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" />
      </g>

      {/* Bubble 3 — Question */}
      <g className="fq-bubble3">
        <rect x="4" y="82" width="26" height="14" rx="3" fill="rgba(184,151,58,0.025)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
        <text x="17" y="91" textAnchor="middle" fill="rgba(184,151,58,0.15)" fontSize="8" fontFamily="serif">?</text>
        <path d="M8 96 L4 100 L12 96" fill="rgba(184,151,58,0.025)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
      </g>

      {/* Connecting vertical dashed line */}
      <line className="fq-connect" x1="18" y1="50" x2="18" y2="82" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />

      {/* ── RIGHT: CATEGORY TREE ── */}
      {/* Vertical trunk */}
      <line x1="240" y1="30" x2="240" y2="130" stroke="rgba(184,151,58,0.08)" strokeWidth="0.5" />

      {/* Branch 1 */}
      <g className="fq-branch1">
        <line x1="240" y1="42" x2="255" y2="42" stroke="rgba(184,151,58,0.12)" strokeWidth="0.4" />
        <rect x="257" y="37" width="8" height="10" rx="1.5" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
        {/* Folder icon lines inside */}
        <line x1="259" y1="40" x2="263" y2="40" stroke="rgba(184,151,58,0.08)" strokeWidth="0.3" />
        <line x1="259" y1="43" x2="263" y2="43" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <rect x="268" y="39" width="30" height="2.5" rx="0.5" fill="rgba(184,151,58,0.05)" />
        <text x="269" y="48" fill="rgba(184,151,58,0.08)" fontSize="2.5" fontFamily="monospace">Primeros Pasos</text>
      </g>

      {/* Branch 2 — Active */}
      <g className="fq-branch2">
        <line x1="240" y1="70" x2="255" y2="70" stroke="rgba(184,151,58,0.15)" strokeWidth="0.4" />
        <rect x="257" y="65" width="8" height="10" rx="1.5" fill="rgba(184,151,58,0.05)" stroke="rgba(184,151,58,0.15)" strokeWidth="0.5" />
        <line x1="259" y1="68" x2="263" y2="68" stroke="rgba(184,151,58,0.12)" strokeWidth="0.3" />
        <line x1="259" y1="71" x2="263" y2="71" stroke="rgba(184,151,58,0.1)" strokeWidth="0.3" />
        <rect x="268" y="67" width="35" height="2.5" rx="0.5" fill="rgba(184,151,58,0.07)" />
        <text x="269" y="76" fill="rgba(184,151,58,0.12)" fontSize="2.5" fontFamily="monospace">Funcionalidades</text>
        {/* Active indicator dot */}
        <circle cx="237" cy="70" r="2" fill="rgba(184,151,58,0.25)" />
      </g>

      {/* Branch 3 */}
      <g className="fq-branch3">
        <line x1="240" y1="98" x2="255" y2="98" stroke="rgba(184,151,58,0.1)" strokeWidth="0.4" />
        <rect x="257" y="93" width="8" height="10" rx="1.5" fill="rgba(184,151,58,0.03)" stroke="rgba(184,151,58,0.08)" strokeWidth="0.4" />
        <line x1="259" y1="96" x2="263" y2="96" stroke="rgba(184,151,58,0.06)" strokeWidth="0.3" />
        <line x1="259" y1="99" x2="263" y2="99" stroke="rgba(184,151,58,0.05)" strokeWidth="0.3" />
        <rect x="268" y="95" width="28" height="2.5" rx="0.5" fill="rgba(184,151,58,0.04)" />
        <text x="269" y="104" fill="rgba(184,151,58,0.07)" fontSize="2.5" fontFamily="monospace">Precios</text>
      </g>

      {/* More categories indicator */}
      <circle cx="240" cy="118" r="1" fill="rgba(184,151,58,0.08)" />
      <circle cx="240" cy="123" r="1" fill="rgba(184,151,58,0.06)" />
      <circle cx="240" cy="128" r="1" fill="rgba(184,151,58,0.04)" />

      {/* ── FLOATING ? PARTICLES ── */}
      <text className="fq-q1" x="230" y="25" fill="rgba(184,151,58,0.15)" fontSize="10" fontFamily="serif">?</text>
      <text className="fq-q2" x="280" y="50" fill="rgba(184,151,58,0.1)" fontSize="7" fontFamily="serif">?</text>
      <text className="fq-q3" x="300" y="90" fill="rgba(184,151,58,0.08)" fontSize="12" fontFamily="serif">?</text>
      <text className="fq-q4" x="260" y="145" fill="rgba(184,151,58,0.12)" fontSize="8" fontFamily="serif">?</text>
      <text className="fq-q5" x="310" y="130" fill="rgba(184,151,58,0.06)" fontSize="9" fontFamily="serif">?</text>

      {/* ── MAGNIFYING GLASS (scanning) ── */}
      <g className="fq-mag">
        <circle cx="285" cy="160" r="8" stroke="rgba(184,151,58,0.18)" strokeWidth="0.7" fill="rgba(184,151,58,0.02)" />
        <line x1="291" y1="166" x2="298" y2="173" stroke="rgba(184,151,58,0.18)" strokeWidth="1" strokeLinecap="round" />
        {/* Lens glint */}
        <path d="M280 155 A4 4 0 0 1 284 153" stroke="rgba(184,151,58,0.1)" strokeWidth="0.5" fill="none" />
      </g>

      {/* ── GOLD DUST ── */}
      <circle className="fq-dust1" cx="15" cy="25" r="1.3" fill="rgba(184,151,58,0.12)" />
      <circle className="fq-dust2" cx="310" cy="15" r="1" fill="rgba(184,151,58,0.08)" />
      <circle className="fq-dust3" cx="35" cy="120" r="1.5" fill="rgba(184,151,58,0.1)" />
      <circle className="fq-dust4" cx="225" cy="160" r="1" fill="rgba(184,151,58,0.06)" />
      <circle className="fq-dust5" cx="310" cy="170" r="1.2" fill="rgba(184,151,58,0.08)" />
      <circle className="fq-dust6" cx="5" cy="160" r="1.1" fill="rgba(184,151,58,0.06)" />
    </svg>
  );
}

const faqs = [
  {
    category: "Primeros Pasos",
    questions: [
      { q: "¿Qué es NODDO exactamente?", a: "NODDO es una plataforma SaaS que permite a constructoras e inmobiliarias crear micrositios digitales premium para sus proyectos. No es un simple generador de páginas — es una sala de ventas digital completa con inventario en vivo, cotizador automático, captura de leads con CRM integrado, y analytics en tiempo real." },
      { q: "¿Cuánto tiempo toma lanzar un proyecto?", a: "Entre 1 y 3 días. Si tienes tu contenido listo (renders, planos, textos), puedes publicar en menos de 24 horas. Muchos clientes lanzan el mismo día con ayuda de nuestro equipo de onboarding. El proceso es: Día 1 — Cargar contenido. Día 2 — Configurar inventario y branding. Día 3 — Publicación." },
      { q: "¿Necesito conocimientos técnicos o un equipo IT?", a: "No. Si sabes usar Excel y subir archivos a Drive, puedes usar NODDO. La interfaz es punto-y-click, sin código. Nuestro equipo de onboarding te guía en el primer proyecto paso a paso." },
      { q: "¿Puedo migrar mi contenido existente?", a: "Sí. Podemos importar tu inventario desde Excel/Google Sheets. Las imágenes se suben por lotes arrastrando carpetas. Si ya tienes un sitio, podemos ayudarte a migrar el contenido en el onboarding." },
      { q: "¿Qué pasa con mi sitio si cancelo o pauso el servicio?", a: "Tienes acceso hasta el final del período pagado. Después, el sitio se desactiva pero tus datos se conservan por 30 días por seguridad. Puedes exportar toda tu información (leads, analytics, contenido) en cualquier momento antes de la eliminación definitiva." },
    ],
  },
  {
    category: "Funcionalidades",
    questions: [
      { q: "¿Puedo conectar mi propio dominio?", a: "Sí. Puedes usar dominios personalizados (ej: torreazul.com) en lugar del subdominio de NODDO (torreazul.noddo.io). La configuración DNS es guiada — te decimos exactamente qué registros crear." },
      { q: "¿Cómo funciona la integración con CRM?", a: "Integramos con GoHighLevel y HubSpot mediante webhooks. Cada lead capturado en tu microsite se envía automáticamente a tu CRM en tiempo real con toda la información: nombre, email, teléfono, unidad de interés, parámetros UTM para rastrear fuente." },
      { q: "¿Puedo actualizar inventario en tiempo real?", a: "Sí. Tienes un panel de administración donde cambias estado de unidades (disponible, reservada, vendida) en 2 clicks. Los cambios se reflejan instantáneamente en el microsite. También puedes invitar hasta 3 colaboradores (ej: asesores de ventas) con permisos limitados solo para actualizar inventario." },
      { q: "¿Soporta tours virtuales 360°?", a: "Sí. Puedes embeber tours de Matterport o subir tours 360° propios. Los almacenamos en Cloudflare Stream (streaming optimizado) o puedes usar URL externa." },
      { q: "¿Puedo tener múltiples proyectos?", a: "Sí. Cada plan incluye cierto número de proyectos activos. Si necesitas más, puedes actualizar tu plan o pagar proyectos adicionales a la carta." },
    ],
  },
  {
    category: "Precios y Planes",
    questions: [
      { q: "¿Cuánto cuesta NODDO? ¿Cuál es el precio exacto?", a: "Tenemos 3 planes: Proyecto ($149/mes, 1 proyecto, 200 unidades), Studio ($349/mes, 3 proyectos, unidades ilimitadas, dominio propio, CRM), y Enterprise (personalizado, white-label, múltiples marcas). Todos los precios incluyen TODO — no hay costos ocultos." },
      { q: "¿Hay período de prueba gratis o demo?", a: "Ofrecemos garantía de reembolso de 14 días — mejor que un trial porque ya tienes acceso completo a todas las funcionalidades. Si no estás satisfecho en las primeras 2 semanas, te devolvemos el 100% sin preguntas. También puedes ver un proyecto demo en vivo antes de contratar." },
      { q: "¿Qué incluyen los precios? ¿Hay costos ocultos?", a: "Todo incluido: hosting ilimitado, bandwidth sin medición, almacenamiento de imágenes/videos, SSL automático, dominio .noddo.io (o personalizado en Studio+), analytics en tiempo real, captura de leads ilimitada, soporte por email, actualizaciones automáticas. Cero costos ocultos. Cero cargos por tráfico o visitantes." },
      { q: "¿Puedo cambiar de plan después o hacer downgrade?", a: "Sí, en cualquier momento. Upgrade: pagas la diferencia prorrateada y aplica inmediatamente. Downgrade: el cambio aplica al próximo ciclo de facturación. Nunca pierdes datos ni configuración al cambiar de plan — todo se conserva." },
      { q: "¿Hay descuento por pago anual o por múltiples proyectos?", a: "Sí, 20% de descuento en planes anuales (ahorras 2.4 meses). Si pagas por adelantado, el ahorro es inmediato. También ofrecemos descuentos a partir de 5+ proyectos — contáctanos para pricing personalizado." },
      { q: "¿Qué pasa si mi proyecto crece y supero el límite de unidades?", a: "En el plan Proyecto (200 unidades), si creces, te avisamos antes del límite. Puedes hacer upgrade a Studio (unidades ilimitadas) y pagas solo la diferencia prorrateada. Nunca bloqueamos tu sitio por crecer — siempre hay una ruta clara." },
    ],
  },
  {
    category: "Técnico",
    questions: [
      { q: "¿Dónde se almacenan mis datos?", a: "En servidores de Supabase (PostgreSQL) ubicados en Estados Unidos, con backups automáticos diarios. Los videos y tours pesados van a Cloudflare R2 (CDN global). Todo encriptado en tránsito (HTTPS) y en reposo (AES-256)." },
      { q: "¿Qué tan rápido carga el sitio?", a: "Muy rápido. Usamos Next.js 16 con Turbopack, CDN global de Vercel, imágenes optimizadas automáticamente (WebP, lazy loading), y caching agresivo. Tiempo de carga típico: <2 segundos en móvil 4G." },
      { q: "¿Es responsive / mobile-first?", a: "Totalmente. Más del 70% de visitantes inmobiliarios vienen de móvil. Los microsites están optimizados para pantallas pequeñas primero, luego escritorio. Todo funciona perfectamente en iPhone, Android, tablets." },
      { q: "¿Qué pasa si hay un problema técnico?", a: "Tenemos monitoreo 24/7 con Sentry y alertas automáticas. Si algo falla, lo sabemos antes que tú. SLA objetivo: 99.5% uptime. En caso de incident, puedes ver el estado en tiempo real en noddo.io/estado." },
      { q: "¿Hacen backups de mi contenido?", a: "Sí. Backups automáticos diarios con retención de 30 días. Si borras algo por error, podemos restaurarlo. También puedes exportar todos tus datos en cualquier momento (JSON, CSV)." },
    ],
  },
  {
    category: "Leads, CRM y Ventas",
    questions: [
      { q: "¿Cómo recibo los leads? ¿Dónde llegan?", a: "Tienes 3 opciones: (1) Email instantáneo cada vez que alguien llena el formulario, (2) Panel de administración con todos los leads, filtros, búsqueda y exportación, (3) Webhook automático a tu CRM (GoHighLevel, HubSpot, Salesforce, Zapier, Make). Puedes activar las 3 simultáneamente." },
      { q: "¿Puedo ver de dónde vienen mis leads? ¿Rastrean campañas?", a: "Sí, cada lead captura automáticamente parámetros UTM (utm_source, utm_medium, utm_campaign, utm_content, utm_term) para que sepas exactamente qué campaña, anuncio o post generó ese lead. También rastreamos navegador, dispositivo, ciudad, y tiempo en sitio antes de convertir." },
      { q: "¿Se integra con mi CRM existente?", a: "Sí. Planes Studio y Enterprise incluyen integración directa con GoHighLevel, HubSpot, y Salesforce mediante webhooks. Los leads se envían en tiempo real con toda la información. Para otros CRMs, puedes usar Zapier o Make (webhooks genéricos)." },
      { q: "¿El formulario de contacto incluye WhatsApp?", a: "Sí. Todos los microsites tienen botón flotante de WhatsApp que abre conversación directa con el número de contacto del proyecto. El mensaje se pre-llena automáticamente con información del proyecto y unidad de interés para facilitar la conversación." },
      { q: "¿Puedo hacer seguimiento a mis leads dentro de NODDO?", a: "Sí. El panel de leads incluye: búsqueda, filtros por fecha/proyecto/estado, notas internas, etiquetas, exportación a CSV/Excel, y vista de historial completo de cada contacto. No reemplaza un CRM completo, pero es útil para seguimiento básico." },
      { q: "¿Puedo A/B test diferentes versiones del sitio?", a: "Próximamente. Por ahora, puedes crear versiones (snapshots) de tu proyecto y restaurarlas si quieres volver atrás. A/B testing nativo con métricas automáticas está en nuestro roadmap Q2 2026." },
    ],
  },
  {
    category: "Seguridad y Datos",
    questions: [
      { q: "¿Dónde se almacenan mis datos? ¿Son seguros?", a: "En servidores de Supabase (PostgreSQL) ubicados en Estados Unidos, con backups automáticos diarios y replicación en múltiples zonas. Videos y tours pesados van a Cloudflare R2 (CDN global). Todo encriptado en tránsito (HTTPS/TLS 1.3) y en reposo (AES-256)." },
      { q: "¿Puedo exportar mis datos en cualquier momento?", a: "Sí, siempre. Puedes exportar leads (CSV/Excel), contenido (JSON), analytics (CSV), e imágenes (ZIP) desde el panel de administración. Nunca retenemos tus datos como rehenes — son tuyos y puedes llevártelos cuando quieras." },
      { q: "¿Cumplen con GDPR y leyes de protección de datos?", a: "Sí. Somos compatibles con GDPR, CCPA, y LOPD. Tenemos política de privacidad clara, consentimientos explícitos, y procesos de eliminación bajo demanda. Los datos de leads solo se usan para tu gestión comercial — nunca los vendemos ni compartimos con terceros." },
      { q: "¿Hacen backups de mi contenido automáticamente?", a: "Sí. Backups automáticos diarios con retención de 30 días. Si borras algo por error, podemos restaurarlo. También puedes crear snapshots manuales antes de cambios importantes y restaurarlos cuando quieras." },
      { q: "¿Qué tan seguro es el sitio contra hackeos o ataques?", a: "Muy seguro. Usamos infraestructura enterprise de Vercel + Supabase con: protección DDoS automática, WAF (Web Application Firewall), rate limiting, autenticación robusta, y monitoreo 24/7. Actualizamos dependencias semanalmente. No almacenamos datos de pago — eso va directo a Stripe (PCI-DSS Level 1)." },
    ],
  },
  {
    category: "Personalización y Marca",
    questions: [
      { q: "¿Puedo personalizar colores, fuentes y diseño?", a: "Sí. Cada proyecto tiene configuración de branding: colores primarios/secundarios, fuentes (elegir de biblioteca o subir propias), logos, y estilos de botones. En Enterprise, podemos hacer personalizaciones de diseño más profundas bajo pedido." },
      { q: "¿Sirve para múltiples proyectos con diferentes marcas?", a: "Sí. Cada proyecto es independiente con su propio branding, dominio, y configuración. Perfecto si manejas múltiples proyectos o si eres agencia/inmobiliaria con varios clientes. En Enterprise, puedes white-label completo y manejar submarcas." },
      { q: "¿Puedo agregar mi pixel de Facebook/Google Ads?", a: "Sí. Puedes insertar scripts personalizados (Facebook Pixel, Google Tag Manager, Google Analytics, LinkedIn Insight Tag, etc.) desde el panel de configuración. Los eventos de conversión se rastrean automáticamente." },
      { q: "¿El sitio se adapta a móviles y tablets?", a: "Totalmente responsive. Más del 70% de visitantes inmobiliarios vienen de móvil. Los microsites están optimizados mobile-first: carga rápida en 4G, touch-friendly, formularios simples, imágenes optimizadas. Se ve perfecto en iPhone, Android, iPad, desktop." },
    ],
  },
  {
    category: "Casos de Uso",
    questions: [
      { q: "¿NODDO sirve solo para apartamentos o también para casas/lotes/comercial?", a: "Sirve para cualquier tipo de proyecto inmobiliario: apartamentos, casas, townhouses, lotes urbanizados, oficinas, locales comerciales, bodegas, proyectos mixtos. La plataforma se adapta al tipo de unidad — puedes configurar specs personalizadas para cada tipo." },
      { q: "¿Funciona para proyectos fuera de Colombia?", a: "Sí. Tenemos clientes activos en Colombia, México, Perú, Ecuador, Panamá, y Miami. La plataforma soporta múltiples monedas (COP, USD, MXN, PEN, etc.), idiomas (español, inglés, portugués), y configuraciones fiscales. El soporte es en español en horario americano." },
      { q: "¿Puedo usarlo para preventa antes de tener renders finales?", a: "Sí. Muchos clientes lanzan en fase de preventa con renders preliminares, planos arquitectónicos, y descripciones. Puedes ir actualizando el contenido a medida que avanza el proyecto — renders definitivos, fotos de obra, videos de avance, tours 360° cuando estén listos." },
      { q: "¿Sirve para proyectos pequeños (menos de 20 unidades)?", a: "Perfectamente. No hay mínimo de unidades. Tenemos clientes con proyectos de 8 casas hasta torres de 400+ apartamentos. El plan Proyecto (hasta 200 unidades) es ideal para proyectos pequeños y medianos." },
    ],
  },
  {
    category: "Soporte y Capacitación",
    questions: [
      { q: "¿Qué tipo de soporte ofrecen y en qué horario?", a: "Soporte por email (hola@noddo.io) con respuesta en 24-48 horas hábiles (lunes a viernes, 9am-6pm COT). Para planes Enterprise, ofrecemos soporte prioritario con respuesta <4 horas, WhatsApp directo, y onboarding dedicado con videollamadas." },
      { q: "¿Hay documentación o tutoriales?", a: "Sí. Tenemos centro de ayuda con guías escritas y video tutorials para las tareas más comunes: subir contenido, configurar inventario, personalizar branding, conectar dominio, exportar leads. La documentación se actualiza continuamente." },
      { q: "¿Ofrecen capacitación para mi equipo de ventas?", a: "Sí. Todos los clientes nuevos reciben onboarding call de 30-45 minutos donde te guiamos en la creación de tu primer proyecto paso a paso. Para equipos grandes (5+ personas), ofrecemos sesiones de capacitación grupal personalizadas (disponible en Enterprise)." },
      { q: "¿Qué pasa si hay un problema técnico o el sitio cae?", a: "Tenemos monitoreo 24/7 con Sentry y alertas automáticas. Si algo falla, lo sabemos antes que tú. SLA objetivo: 99.5% uptime. En caso de incidente, puedes ver el estado en tiempo real en noddo.io/estado. Planes Enterprise tienen SLA garantizado de 99.9%." },
    ],
  },
];

const totalQuestions = faqs.reduce((sum, cat) => sum + cat.questions.length, 0);

export default function FAQPage() {
  usePageView("FAQ");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 selection:bg-[rgba(184,151,58,0.30)] selection:text-[var(--mk-text-primary)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light"
          >
            <HelpCircle className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Ayuda
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease }}
            className="text-5xl md:text-7xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Preguntas{" "}
            <em style={{ fontStyle: "italic", color: "#b8973a" }}>Frecuentes</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease }}
            className="text-base max-w-2xl mx-auto"
            style={{
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            {totalQuestions} respuestas sobre NODDO. Si no encuentras lo que buscas, escríbenos a{" "}
            <a href="mailto:hola@noddo.io" className="underline" style={{ color: "#b8973a" }}>
              hola@noddo.io
            </a>
          </motion.p>

          {/* Hero SVG */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease }}
            className="mt-12 mb-4 flex justify-center"
          >
            <KnowledgeSearchIllustration />
          </motion.div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category, catIndex) => (
            <motion.section
              key={catIndex}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="w-1 h-8 rounded-full"
                  style={{ background: "#b8973a" }}
                />
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {category.category}
                </h2>
              </div>
              <div className="space-y-4">
                {category.questions.map((faq, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  return (
                    <div key={qIndex} className="glass-card overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left transition-all duration-200 hover:bg-white/5"
                      >
                        <span
                          className="text-base pr-4"
                          style={{
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {faq.q}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.3, ease }}
                        >
                          <ChevronDown
                            className="w-5 h-5 shrink-0"
                            style={{ color: "#b8973a" }}
                          />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease }}
                          >
                            <div className="px-6 pb-5 pt-2">
                              <p
                                className="text-sm leading-[1.8]"
                                style={{
                                  fontWeight: 300,
                                  color: "rgba(244,240,232,0.70)",
                                }}
                              >
                                {faq.a}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="mt-16 text-center"
        >
          <div className="glass-card p-10">
            <h2
              className="text-2xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿No encontraste lo que buscabas?
            </h2>
            <p
              className="text-sm mb-6"
              style={{
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Nuestro equipo está listo para ayudarte
            </p>
            <a
              href="mailto:hola@noddo.io"
              className="btn-mk-primary inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              CONTÁCTANOS
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
