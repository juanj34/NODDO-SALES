"use client";

import { Target, Rocket, Users, Heart, Zap, Globe, Award, TrendingUp } from "lucide-react";

export default function NosotrosPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 rounded-full glass-light">
            <Heart className="w-5 h-5" style={{ color: "#b8973a" }} />
            <span
              className="text-sm uppercase tracking-[0.15em]"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              Nosotros
            </span>
          </div>
          <h1
            className="text-5xl md:text-7xl mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Revolucionando la
            <br />
            <span style={{ fontStyle: "italic", color: "#b8973a" }}>
              venta inmobiliaria
            </span>
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto leading-relaxed"
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontWeight: 300,
              color: "rgba(244,240,232,0.55)",
            }}
          >
            NODDO nació de una frustración: las constructoras invierten meses y decenas de miles
            de dólares en páginas web que terminan siendo folletos digitales estáticos. Creamos
            la alternativa.
          </p>
        </div>

        {/* Mission */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Target className="w-7 h-7" style={{ color: "#b8973a" }} />
            </div>
            <div>
              <h2
                className="text-3xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Nuestra Misión
              </h2>
              <p
                className="text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Democratizar la tecnología de ventas inmobiliarias. Que una constructora de 3
                proyectos tenga la misma presencia digital que un desarrollador de 50. Sin
                agencias. Sin código. Sin esperas.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Rocket className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                Nuestra Historia
              </h2>
              <div
                className="space-y-4 text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <p>
                  En 2024, trabajando con constructoras en Colombia, nos dimos cuenta de un patrón:
                  todas necesitaban sitios web para sus proyectos, pero el proceso era lento,
                  caro, y frustrante.
                </p>
                <p>
                  Las agencias cobraban entre $5,000 y $15,000 USD, tardaban 2-3 meses, y
                  entregaban sitios bonitos pero{" "}
                  <span style={{ color: "rgba(244,240,232,0.92)", fontWeight: 400 }}>
                    completamente estáticos
                  </span>
                  . Cambiar un precio requería un ticket de soporte. Actualizar inventario era un
                  dolor de cabeza. Y los leads se perdían en emails.
                </p>
                <p>
                  Pensamos:{" "}
                  <span
                    style={{
                      fontStyle: "italic",
                      color: "#b8973a",
                      fontFamily: "var(--font-cormorant)",
                      fontSize: "1.1em",
                    }}
                  >
                    &quot;¿Y si una constructora pudiera tener un showroom digital premium listo en 1
                    día?&quot;
                  </span>
                </p>
                <p>
                  Así nació NODDO. No solo un generador de sitios, sino una{" "}
                  <span style={{ color: "rgba(244,240,232,0.92)", fontWeight: 400 }}>
                    sala de ventas digital completa
                  </span>
                  : inventario en vivo, cotizador, captura de leads con CRM integrado, analytics,
                  y todo actualizable en segundos.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mb-12">
          <h2
            className="text-3xl mb-8 text-center"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Velocidad */}
            <div className="glass-card p-8">
              <div
                className="inline-flex p-3 rounded-xl mb-4"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <Zap className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
              <h3
                className="text-xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Velocidad
              </h3>
              <p
                className="text-sm leading-[1.8]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                El tiempo es dinero en bienes raíces. Nos obsesiona que nuestros clientes lancen
                proyectos en días, no meses. Cada segundo cuenta.
              </p>
            </div>

            {/* Simplicidad */}
            <div className="glass-card p-8">
              <div
                className="inline-flex p-3 rounded-xl mb-4"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <Heart className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
              <h3
                className="text-xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Simplicidad
              </h3>
              <p
                className="text-sm leading-[1.8]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                La tecnología debe ser invisible. Nuestros clientes no son developers — son
                vendedores. Diseñamos para que cualquiera pueda usarlo sin manual.
              </p>
            </div>

            {/* Excelencia */}
            <div className="glass-card p-8">
              <div
                className="inline-flex p-3 rounded-xl mb-4"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <Award className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
              <h3
                className="text-xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Excelencia
              </h3>
              <p
                className="text-sm leading-[1.8]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Ser rápido no significa ser mediocre. Cada microsite que generamos es premium:
                diseño de lujo, carga rápida, mobile-first, experiencia pulida.
              </p>
            </div>

            {/* Transparencia */}
            <div className="glass-card p-8">
              <div
                className="inline-flex p-3 rounded-xl mb-4"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
              <h3
                className="text-xl mb-3"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  color: "rgba(244,240,232,0.92)",
                }}
              >
                Transparencia
              </h3>
              <p
                className="text-sm leading-[1.8]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Sin letra pequeña. Sin cargos ocultos. Sin trucos. Precio claro, funcionalidades
                claras, uptime público. Construimos confianza siendo directos.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Users className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                El Equipo
              </h2>
              <p
                className="text-base leading-[1.9] mb-4"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Somos un equipo pequeño y ágil con experiencia en proptech, SaaS, y desarrollo
                inmobiliario. Combinamos:
              </p>
              <ul
                className="list-disc pl-6 space-y-2 text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                <li>
                  <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                    Expertise inmobiliario
                  </strong>{" "}
                  — Entendemos cómo se venden apartamentos, no solo cómo se hace un sitio web
                </li>
                <li>
                  <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                    Excelencia técnica
                  </strong>{" "}
                  — Stack moderno, infraestructura escalable, código limpio
                </li>
                <li>
                  <strong style={{ color: "rgba(244,240,232,0.92)" }}>Obsesión por UX</strong> —
                  Cada píxel, cada click, cada segundo importa
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Global */}
        <section className="glass-card p-10 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
            >
              <Globe className="w-7 h-7" style={{ color: "#b8973a" }} />
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
                Alcance Global
              </h2>
              <p
                className="text-base leading-[1.9]"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 300,
                  color: "rgba(244,240,232,0.70)",
                }}
              >
                Nacimos en Colombia, pero servimos a constructoras en toda América Latina.
                Próximamente expandiremos a Medio Oriente (Dubai, UAE) y Europa. La tecnología no
                tiene fronteras — y la venta inmobiliaria digital tampoco.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="glass-card p-10">
            <h2
              className="text-3xl mb-4"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.92)",
              }}
            >
              ¿Listo para revolucionar su estrategia de ventas?
            </h2>
            <p
              className="text-base mb-6 max-w-xl mx-auto"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.55)",
              }}
            >
              Únase a las constructoras que ya confían en NODDO para vender más rápido.
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium transition-all duration-200"
              style={{
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
                background: "linear-gradient(135deg, #b8973a 0%, #d4b05a 100%)",
                color: "#0a0a0b",
              }}
            >
              Ver Planes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
