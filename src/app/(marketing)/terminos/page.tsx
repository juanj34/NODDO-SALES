import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio — NODDO",
  description: "Términos y condiciones de uso de la plataforma NODDO.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl md:text-5xl mb-4"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Términos de Servicio
        </h1>
        <p
          className="text-sm mb-12"
          style={{
            fontFamily: "var(--font-dm-mono)",
            color: "rgba(244,240,232,0.35)",
          }}
        >
          Última actualización: marzo 2026
        </p>

        <div
          className="space-y-8 text-sm leading-[1.8]"
          style={{
            fontFamily: "var(--font-dm-mono)",
            color: "rgba(244,240,232,0.70)",
          }}
        >
          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              1. Aceptación de los términos
            </h2>
            <p>
              Al acceder y utilizar la plataforma NODDO (&quot;el Servicio&quot;), operada
              por Antigravity SAS (&quot;la Empresa&quot;), usted acepta estos Términos de
              Servicio. Si no está de acuerdo, no utilice el Servicio.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              2. Descripción del Servicio
            </h2>
            <p>
              NODDO es una plataforma SaaS que permite a constructoras e inmobiliarias
              crear micrositios digitales para la comercialización de proyectos
              inmobiliarios. El Servicio incluye herramientas de gestión de inventario,
              galería de imágenes, tours virtuales, cotizador y captura de leads.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              3. Registro y cuenta
            </h2>
            <p>
              Para usar el Servicio debe crear una cuenta proporcionando información
              veraz. Usted es responsable de mantener la confidencialidad de sus
              credenciales y de todas las actividades realizadas desde su cuenta.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              4. Planes y pagos
            </h2>
            <p>
              Los planes disponibles y sus precios están publicados en noddo.io/pricing.
              Los pagos son recurrentes según el ciclo de facturación seleccionado. La
              falta de pago puede resultar en la suspensión del Servicio. Los proyectos
              y datos se conservan por 30 días después de la cancelación.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              5. Uso aceptable
            </h2>
            <p>
              El usuario se compromete a utilizar el Servicio únicamente para fines
              legítimos relacionados con la comercialización inmobiliaria. Queda prohibido:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Publicar contenido ilegal, difamatorio o fraudulento</li>
              <li>Intentar acceder a cuentas o datos de otros usuarios</li>
              <li>Usar el Servicio para enviar spam o comunicaciones no solicitadas</li>
              <li>Realizar ingeniería inversa o intentar extraer el código fuente</li>
            </ul>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              6. Propiedad intelectual
            </h2>
            <p>
              El contenido que usted sube (imágenes, textos, renders) sigue siendo de
              su propiedad. NODDO no reclama derechos sobre su contenido. Sin embargo,
              usted otorga a NODDO una licencia limitada para mostrar dicho contenido
              en los micrositios generados y materiales promocionales del Servicio.
            </p>
            <p className="mt-2">
              La plataforma NODDO, su diseño, código y marca son propiedad de
              Antigravity SAS y están protegidos por las leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              7. Disponibilidad del Servicio
            </h2>
            <p>
              NODDO se esfuerza por mantener el Servicio disponible 24/7, pero no
              garantiza disponibilidad ininterrumpida. Pueden ocurrir interrupciones por
              mantenimiento, actualizaciones o circunstancias fuera de nuestro control.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              8. Limitación de responsabilidad
            </h2>
            <p>
              NODDO no será responsable por daños indirectos, incidentales o
              consecuentes derivados del uso del Servicio. La responsabilidad total de
              NODDO estará limitada al monto pagado por el usuario en los últimos 12
              meses.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              9. Cancelación
            </h2>
            <p>
              Usted puede cancelar su suscripción en cualquier momento. Tras la
              cancelación, tendrá acceso hasta el final del período de facturación
              pagado. Los datos se conservan por 30 días adicionales antes de ser
              eliminados permanentemente.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              10. Modificaciones
            </h2>
            <p>
              NODDO se reserva el derecho de modificar estos términos. Los cambios
              significativos se notificarán por email con al menos 30 días de
              anticipación.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              11. Legislación aplicable
            </h2>
            <p>
              Estos términos se rigen por las leyes de la República de Colombia. Para
              cualquier controversia, las partes se someten a la jurisdicción de los
              tribunales de Medellín, Colombia.
            </p>
          </section>

          <section>
            <h2
              className="text-xl mb-3"
              style={{
                fontFamily: "var(--font-cormorant)",
                color: "rgba(244,240,232,0.92)",
              }}
            >
              12. Contacto
            </h2>
            <p>
              Para consultas sobre estos términos, contáctenos en{" "}
              <a
                href="mailto:hola@noddo.io"
                className="underline"
                style={{ color: "#b8973a" }}
              >
                hola@noddo.io
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
