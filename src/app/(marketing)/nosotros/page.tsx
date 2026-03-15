"use client";

import Image from "next/image";
import { Target, Rocket, Users, Heart, Zap, Globe, Award, TrendingUp } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";

export default function NosotrosPage() {
  usePageView("Nosotros");
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

        {/* Timeline */}
        <section className="mb-16">
          <h2
            className="text-3xl mb-10 text-center"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontWeight: 400,
              color: "rgba(244,240,232,0.92)",
            }}
          >
            Nuestro Recorrido
          </h2>
          <div className="relative">
            {/* Timeline line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-px"
              style={{
                background: "linear-gradient(to bottom, transparent, #b8973a 20%, #b8973a 80%, transparent)",
              }}
            />

            {/* Timeline items */}
            <div className="space-y-16">
              {[
                {
                  year: "2024",
                  title: "Fundación",
                  desc: "Nacimos en Medellín con la visión de democratizar la tecnología de ventas inmobiliarias. Primeros 5 clientes en Colombia.",
                  side: "left",
                },
                {
                  year: "2025",
                  title: "Tracción",
                  desc: "$150M+ en inventario gestionado. Expansión a México y Perú. Primeras integraciones enterprise con CRMs.",
                  side: "right",
                },
                {
                  year: "2026",
                  title: "Escala",
                  desc: "34 proyectos activos en 6 países. Lanzamiento de features avanzadas: A/B testing, WhatsApp Business API, analytics predictivos.",
                  side: "left",
                },
                {
                  year: "2027",
                  title: "Global",
                  desc: "Próxima expansión a Dubai, UAE y mercados europeos. Objetivo: ser la plataforma #1 de ventas inmobiliarias digitales en LATAM y MENA.",
                  side: "right",
                },
              ].map((item) => (
                <div key={item.year} className={`flex items-center ${item.side === "right" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-1/2 ${item.side === "left" ? "pr-12 text-right" : "pl-12"}`}>
                    <div className="glass-card p-6 inline-block">
                      <div
                        className="text-5xl mb-2 font-light"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          color: "#b8973a",
                        }}
                      >
                        {item.year}
                      </div>
                      <h3
                        className="text-xl mb-2"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontWeight: 400,
                          color: "rgba(244,240,232,0.92)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm leading-[1.7]"
                        style={{
                          fontFamily: "var(--font-dm-mono)",
                          fontWeight: 300,
                          color: "rgba(244,240,232,0.70)",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full border-4 relative z-10"
                    style={{
                      borderColor: "#b8973a",
                      backgroundColor: "#0a0a0b",
                      boxShadow: "0 0 20px rgba(184, 151, 58, 0.5)",
                    }}
                  />
                  <div className="w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: "rgba(184, 151, 58, 0.12)" }}
              >
                <Users className="w-6 h-6" style={{ color: "#b8973a" }} />
              </div>
            </div>
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
              className="text-base max-w-2xl mx-auto leading-[1.9]"
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontWeight: 300,
                color: "rgba(244,240,232,0.70)",
              }}
            >
              Somos un equipo pequeño y ágil con experiencia en proptech, SaaS, y desarrollo
              inmobiliario. Combinamos expertise técnico con conocimiento profundo del sector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Juan Rodríguez",
                role: "CEO & Co-Founder",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
                linkedin: "#",
                bio: "10+ años en proptech y desarrollo inmobiliario. Anteriormente en Habi y Properati. Experto en product-market fit para SaaS B2B.",
              },
              {
                name: "María González",
                role: "CTO & Co-Founder",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
                linkedin: "#",
                bio: "Engineering lead con 8 años en startups de alto crecimiento. Especialista en arquitectura escalable y developer experience.",
              },
              {
                name: "Carlos Mendoza",
                role: "Head of Sales",
                avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
                linkedin: "#",
                bio: "15 años vendiendo software enterprise a constructoras. Ex-director comercial en Oracle y Salesforce para sector inmobiliario.",
              },
            ].map((member) => (
              <div key={member.name} className="glass-card p-6 text-center hover:bg-white/5 transition-all duration-300">
                <Image src={member.avatar} alt="" width={400} height={300} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" style={{
                    border: "3px solid rgba(184, 151, 58, 0.3)",
                  }} />
                <h3
                  className="text-xl mb-1"
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontWeight: 400,
                    color: "rgba(244,240,232,0.92)",
                  }}
                >
                  {member.name}
                </h3>
                <p
                  className="text-xs mb-3 uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    color: "#b8973a",
                  }}
                >
                  {member.role}
                </p>
                <p
                  className="text-sm leading-[1.7] mb-4"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    fontWeight: 300,
                    color: "rgba(244,240,232,0.70)",
                  }}
                >
                  {member.bio}
                </p>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-lg transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontWeight: 600,
                    backgroundColor: "rgba(184, 151, 58, 0.15)",
                    color: "#b8973a",
                    border: "1px solid rgba(184, 151, 58, 0.3)",
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            ))}
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
