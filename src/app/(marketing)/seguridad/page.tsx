"use client";

import { Shield, Lock, Eye, Server, Key, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SeguridadPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Shield className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Seguridad
            </span>
          </div>
          <h1
            className="text-5xl md:text-6xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Seguridad de
            <br />
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>nivel empresarial</span>
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            La seguridad de sus datos es nuestra máxima prioridad. Implementamos las mejores
            prácticas de la industria para proteger su información y la de sus clientes.
          </p>
        </div>

        {/* Security Measures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Encriptación */}
          <div className="glass-card p-8">
            <div
              className="inline-flex p-3 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Lock className="w-6 h-6" style={{ color: "#b8973a" }} />
            </div>
            <h3
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Encriptación de Punta a Punta
            </h3>
            <p
              className="text-sm leading-[1.8] mb-3"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Todos los datos están protegidos:
            </p>
            <ul
              className="text-sm leading-[1.8] space-y-1"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>TLS 1.3 para todas las conexiones</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>AES-256 en reposo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Bcrypt para contraseñas (salt rounds: 12)</span>
              </li>
            </ul>
          </div>

          {/* Autenticación */}
          <div className="glass-card p-8">
            <div
              className="inline-flex p-3 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Key className="w-6 h-6" style={{ color: "#b8973a" }} />
            </div>
            <h3
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Autenticación Robusta
            </h3>
            <p
              className="text-sm leading-[1.8] mb-3"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Control de acceso multinivel:
            </p>
            <ul
              className="text-sm leading-[1.8] space-y-1"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>OAuth 2.0 con Google</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>MFA opcional (TOTP)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Tokens JWT con expiración</span>
              </li>
            </ul>
          </div>

          {/* RLS */}
          <div className="glass-card p-8">
            <div
              className="inline-flex p-3 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Eye className="w-6 h-6" style={{ color: "#b8973a" }} />
            </div>
            <h3
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Row Level Security
            </h3>
            <p
              className="text-sm leading-[1.8] mb-3"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Aislamiento a nivel de base de datos:
            </p>
            <ul
              className="text-sm leading-[1.8] space-y-1"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Políticas RLS en PostgreSQL</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Control RBAC granular</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Auditoría de accesos</span>
              </li>
            </ul>
          </div>

          {/* Infraestructura */}
          <div className="glass-card p-8">
            <div
              className="inline-flex p-3 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Server className="w-6 h-6" style={{ color: "#b8973a" }} />
            </div>
            <h3
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 400,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Infraestructura Segura
            </h3>
            <p
              className="text-sm leading-[1.8] mb-3"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Proveedores certificados:
            </p>
            <ul
              className="text-sm leading-[1.8] space-y-1"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Vercel (SOC 2 Type II)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Supabase (SOC 2, ISO 27001)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#b8973a" }} />
                <span>Cloudflare (protección DDoS)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <FileCheck className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Cumplimiento Normativo
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  NODDO cumple con las regulaciones de protección de datos más estrictas:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      Ley 1581 de 2012 (Colombia)
                    </strong>{" "}
                    — Régimen General de Protección de Datos Personales
                  </li>
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      GDPR-ready
                    </strong>{" "}
                    — Preparados para clientes en Europa (portabilidad, derecho al olvido, DPA)
                  </li>
                  <li>
                    <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                      DIFC Data Protection Law
                    </strong>{" "}
                    — Próximamente para clientes en Dubai/UAE
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Monitoring */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Eye className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Monitoreo y Respuesta
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Monitoreo 24/7
                      </strong>{" "}
                      — Sentry para detección de errores en tiempo real, alertas automáticas
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Backups diarios
                      </strong>{" "}
                      — Copias automáticas cada 24h, retención 30 días, recuperación point-in-time
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Plan de respuesta a incidentes
                      </strong>{" "}
                      — Protocolo documentado para brechas de seguridad, notificación en menos de 72h
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 mt-1 shrink-0"
                      style={{ color: "#b8973a" }}
                    />
                    <div>
                      <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                        Logs de auditoría
                      </strong>{" "}
                      — Registro de todos los accesos y cambios sensibles, retención 6 meses
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Vulnerability */}
        <section className="glass-card p-10">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-4"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Reporte de Vulnerabilidades
              </h2>
              <div
                className="space-y-3 text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  Si encuentra una vulnerabilidad de seguridad en NODDO, por favor repórtela de
                  manera responsable a:
                </p>
                <div className="pl-4">
                  <strong style={{ color: "rgba(244,240,232,0.92)" }}>Email:</strong>{" "}
                  <a
                    href="mailto:security@noddo.io"
                    className="underline"
                    style={{ color: "#b8973a" }}
                  >
                    security@noddo.io
                  </a>
                </div>
                <p>
                  Le responderemos en 48 horas con confirmación y cronograma de resolución. Por
                  favor, no divulgue públicamente hasta que hayamos emitido un parche.
                </p>
                <p>
                  Agradecemos a investigadores de seguridad que reporten responsablemente con
                  reconocimiento público (opcional) y potenciales recompensas según severidad.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="glass-card p-10">
            <h2
              className="text-2xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Preguntas sobre seguridad?
            </h2>
            <p
              className="text-sm mb-6"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Estamos felices de responder cualquier consulta sobre nuestras prácticas de seguridad
            </p>
            <a
              href="mailto:security@noddo.io"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
              }}
            >
              <Shield className="w-4 h-4" />
              Contactar Security Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
