"use client";

import { Activity, CheckCircle2, Clock, AlertCircle, Server, Zap, Database, Globe } from "lucide-react";

type Incident = {
  date: string;
  title: string;
  status: "resolved" | "investigating" | "monitoring";
  duration: string;
  description: string;
};

export default function EstadoPage() {
  // En producción, esto vendría de una API real de status
  const status = {
    overall: "operational", // operational | degraded | outage
    uptime: "99.97%",
    lastChecked: new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota",
    }),
    services: [
      {
        name: "Aplicación Web",
        description: "Panel de administración y microsites",
        status: "operational",
        uptime: "99.98%",
      },
      {
        name: "API",
        description: "Endpoints REST y webhooks",
        status: "operational",
        uptime: "99.96%",
      },
      {
        name: "Base de Datos",
        description: "PostgreSQL (Supabase)",
        status: "operational",
        uptime: "99.99%",
      },
      {
        name: "Storage",
        description: "Cloudflare R2 + Supabase Storage",
        status: "operational",
        uptime: "100%",
      },
      {
        name: "CDN",
        description: "Vercel Edge Network",
        status: "operational",
        uptime: "100%",
      },
      {
        name: "Email",
        description: "Notificaciones transaccionales (Resend)",
        status: "operational",
        uptime: "99.95%",
      },
    ],
    incidents: [] as Incident[],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "#4ade80"; // green
      case "degraded":
        return "#fbbf24"; // yellow
      case "outage":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return CheckCircle2;
      case "degraded":
        return AlertCircle;
      case "outage":
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "operational":
        return "Operacional";
      case "degraded":
        return "Degradado";
      case "outage":
        return "Fuera de servicio";
      default:
        return "Desconocido";
    }
  };

  const StatusIcon = getStatusIcon(status.overall);

  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Activity className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Estado del Sistema
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
            Estado de NODDO
          </h1>
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            Monitoreo en tiempo real de todos los servicios de NODDO. Última verificación:{" "}
            {status.lastChecked} COT
          </p>
        </div>

        {/* Overall Status */}
        <div className="glass-card p-10 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: "rgba(78, 222, 128, 0.12)" }}
              >
                <StatusIcon
                  className="w-8 h-8"
                  style={{ color: getStatusColor(status.overall) }}
                />
              </div>
              <div>
                <h2
                  className="text-3xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  Todos los Sistemas{" "}
                  <span style={{ color: getStatusColor(status.overall) }}>
                    {getStatusText(status.overall)}
                  </span>
                </h2>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.55)",
                  }}
                >
                  Uptime últimos 30 días: {status.uptime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <section className="mb-12">
          <h2
            className="text-2xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Estado de Servicios
          </h2>
          <div className="space-y-4">
            {status.services.map((service, index) => {
              const ServiceStatusIcon = getStatusIcon(service.status);
              const icons = [Server, Zap, Database, Globe, Globe, Server];
              const Icon = icons[index] || Server;

              return (
                <div key={index} className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: "rgba(184, 151, 58, 0.08)" }}
                      >
                        <Icon className="w-5 h-5" style={{ color: "#b8973a" }} />
                      </div>
                      <div>
                        <h3
                          className="text-base font-medium mb-0.5"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {service.name}
                        </h3>
                        <p
                          className="text-xs"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p
                          className="text-xs mb-0.5"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 300,
                            color: "rgba(244,240,232,0.55)",
                          }}
                        >
                          Uptime 30d
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {service.uptime}
                        </p>
                      </div>
                      <ServiceStatusIcon
                        className="w-6 h-6"
                        style={{ color: getStatusColor(service.status) }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Incidents */}
        <section className="mb-12">
          <h2
            className="text-2xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Incidentes Recientes
          </h2>
          {status.incidents.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <CheckCircle2
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#4ade80" }}
              />
              <h3
                className="text-xl mb-2"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Sin Incidentes
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                No se han reportado incidentes en los últimos 90 días. Todos los sistemas operan
                normalmente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {status.incidents.map((incident, index) => (
                <div key={index} className="glass-card p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 rounded-lg mt-1"
                      style={{
                        backgroundColor:
                          incident.status === "resolved"
                            ? "rgba(78, 222, 128, 0.12)"
                            : "rgba(251, 191, 36, 0.12)",
                      }}
                    >
                      {incident.status === "resolved" ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: "#4ade80" }} />
                      ) : (
                        <AlertCircle className="w-5 h-5" style={{ color: "#fbbf24" }} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3
                          className="text-base font-medium"
                          style={{
                            fontFamily: "var(--font-dm-mono)",
                            fontWeight: 400,
                            color: "rgba(244,240,232,0.92)",
                          }}
                        >
                          {incident.title}
                        </h3>
                        <span
                          className="text-xs px-3 py-1 rounded-full"
                          style={{
                            fontFamily: "var(--font-syne)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            backgroundColor:
                              incident.status === "resolved"
                                ? "rgba(78, 222, 128, 0.12)"
                                : "rgba(251, 191, 36, 0.12)",
                            color:
                              incident.status === "resolved" ? "#4ade80" : "#fbbf24",
                          }}
                        >
                          {incident.status === "resolved" ? "Resuelto" : "En Progreso"}
                        </span>
                      </div>
                      <p
                        className="text-sm mb-2"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.70)",
                        }}
                      >
                        {incident.description}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.55)",
                        }}
                      >
                        {incident.date} • Duración: {incident.duration}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Info */}
        <div className="glass-card p-8">
          <h3
            className="text-lg mb-3"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Sobre Esta Página
          </h3>
          <div
            className="space-y-2 text-sm leading-[1.8]"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.70)",
            }}
          >
            <p>
              Esta página muestra el estado en tiempo real de todos los servicios de NODDO.
              Monitoreamos constantemente la disponibilidad, rendimiento, y salud de nuestra
              infraestructura.
            </p>
            <p>
              <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                ¿Experimentando problemas?
              </strong>{" "}
              Si nota comportamiento anormal que no está reflejado aquí, por favor contáctenos en{" "}
              <a
                href="mailto:soporte@noddo.io"
                className="underline"
                style={{ color: "#b8973a" }}
              >
                soporte@noddo.io
              </a>
            </p>
            <p>
              <strong style={{ color: "rgba(244,240,232,0.92)" }}>Suscribirse a alertas:</strong>{" "}
              Próximamente podrás suscribirte a notificaciones por email o SMS cuando ocurran
              incidentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
