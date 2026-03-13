import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — NODDO",
  description:
    "Política de privacidad y tratamiento de datos personales de NODDO.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-4xl md:text-5xl mb-4"
          style={{ fontFamily: "var(--font-cormorant)" }}
        >
          Política de Privacidad
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
              1. Responsable del tratamiento
            </h2>
            <p>
              Antigravity SAS, identificada con NIT [por definir], con domicilio en
              Medellín, Colombia, es la responsable del tratamiento de los datos
              personales recopilados a través de la plataforma NODDO (noddo.io).
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
              2. Datos que recopilamos
            </h2>
            <p>Recopilamos los siguientes tipos de datos personales:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                  Datos de registro:
                </strong>{" "}
                nombre, email, contraseña (encriptada)
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                  Datos de contacto (leads):
                </strong>{" "}
                nombre, email, teléfono, país, mensaje, tipología de interés
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                  Datos de uso:
                </strong>{" "}
                páginas visitadas, dispositivo, navegador, IP (anonimizada), sesión
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                  Datos de proyecto:
                </strong>{" "}
                imágenes, textos, renders y contenido que los usuarios suben
              </li>
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
              3. Finalidad del tratamiento
            </h2>
            <p>Los datos personales se utilizan para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Gestionar su cuenta y prestar el Servicio contratado</li>
              <li>
                Transmitir datos de leads al administrador del proyecto inmobiliario
                correspondiente
              </li>
              <li>Enviar notificaciones transaccionales (cotizaciones, leads)</li>
              <li>Mejorar el Servicio mediante análisis de uso agregado</li>
              <li>Cumplir con obligaciones legales</li>
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
              4. Base legal del tratamiento
            </h2>
            <p>
              El tratamiento de datos se realiza con base en: (a) la ejecución del
              contrato de servicio, (b) el consentimiento del titular al enviar
              formularios de contacto, y (c) el interés legítimo para mejora del
              Servicio. En cumplimiento de la Ley 1581 de 2012 (Colombia) y su decreto
              reglamentario 1377 de 2013.
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
              5. Compartir datos con terceros
            </h2>
            <p>
              Los datos de leads se comparten con el administrador del proyecto
              inmobiliario donde el visitante envió el formulario. Esto es esencial
              para el funcionamiento del Servicio.
            </p>
            <p className="mt-2">
              Adicionalmente, utilizamos los siguientes proveedores de servicio:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>Supabase</strong>{" "}
                — Base de datos y autenticación (servidores en EE.UU.)
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>Vercel</strong> —
                Hosting de la aplicación (CDN global)
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>
                  Cloudflare
                </strong>{" "}
                — Almacenamiento de videos y tours (CDN global)
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>Resend</strong> —
                Envío de emails transaccionales
              </li>
              <li>
                <strong style={{ color: "rgba(244,240,232,0.92)" }}>Mapbox</strong> —
                Mapas interactivos (no se envían datos personales)
              </li>
            </ul>
            <p className="mt-2">
              No vendemos, alquilamos ni compartimos datos personales con fines
              publicitarios o de marketing de terceros.
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
              6. Derechos del titular
            </h2>
            <p>
              De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Conocer, actualizar y rectificar sus datos personales</li>
              <li>Solicitar prueba de la autorización otorgada</li>
              <li>Ser informado del uso dado a sus datos</li>
              <li>
                Revocar la autorización y/o solicitar la supresión de sus datos
              </li>
              <li>Acceder gratuitamente a los datos</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, escriba a{" "}
              <a
                href="mailto:hola@noddo.io"
                className="underline"
                style={{ color: "#b8973a" }}
              >
                hola@noddo.io
              </a>
              . Responderemos en un plazo máximo de 15 días hábiles.
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
              7. Seguridad de los datos
            </h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger sus datos,
              incluyendo: encriptación en tránsito (HTTPS/TLS), encriptación en reposo
              de contraseñas, control de acceso basado en roles, y auditoría de
              accesos a nivel de base de datos (Row Level Security).
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
              8. Retención de datos
            </h2>
            <p>
              Los datos de cuenta se conservan mientras la suscripción esté activa y
              30 días adicionales tras la cancelación. Los datos de leads se conservan
              mientras el proyecto esté activo. Los datos de analytics se conservan de
              forma agregada y anonimizada indefinidamente.
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
              9. Cookies y tecnologías similares
            </h2>
            <p>
              NODDO utiliza cookies esenciales para el funcionamiento del Servicio
              (sesión de autenticación, preferencias de idioma). No utilizamos cookies
              de seguimiento publicitario ni de terceros. Los datos de analytics se
              recopilan mediante un sistema propio sin cookies de seguimiento.
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
              10. Transferencia internacional de datos
            </h2>
            <p>
              Sus datos pueden ser procesados en servidores ubicados fuera de Colombia
              (EE.UU., Europa) a través de nuestros proveedores de infraestructura.
              Estos proveedores cumplen con estándares de seguridad equivalentes o
              superiores a los exigidos por la legislación colombiana.
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
              11. Modificaciones
            </h2>
            <p>
              Esta política puede ser actualizada periódicamente. Publicaremos los
              cambios en esta página y, si son significativos, notificaremos por email.
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
              Para cualquier consulta relacionada con esta política o el tratamiento
              de sus datos personales, contáctenos en{" "}
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
