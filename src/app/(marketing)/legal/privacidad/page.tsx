import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad - NODDO",
  description:
    "Política de privacidad de NODDO - Cómo recopilamos, usamos y protegemos tu información personal.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-invert prose-headings:font-site-heading prose-p:font-site-body max-w-none">
      <h1 className="text-4xl font-site-heading font-light text-white mb-2">
        Política de Privacidad
      </h1>
      <p className="text-[var(--text-tertiary)] text-sm mb-8">
        Última actualización: {new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            1. Introducción
          </h2>
          <p>
            En NODDO (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Plataforma&quot;), respetamos tu privacidad y
            nos comprometemos a proteger tu información personal. Esta Política de Privacidad
            explica cómo recopilamos, usamos, compartimos y protegemos tu información cuando usas
            nuestra plataforma SaaS para crear microsites inmobiliarios.
          </p>
          <p>
            Al usar NODDO, aceptas las prácticas descritas en esta política. Si no estás de acuerdo,
            por favor no uses nuestros servicios.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            2. Información que Recopilamos
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            2.1 Información que nos Proporcionas
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Cuenta de usuario:</strong> Nombre, email, contraseña, nombre de empresa,
              teléfono de contacto.
            </li>
            <li>
              <strong>Contenido del proyecto:</strong> Información sobre tus proyectos inmobiliarios
              (nombre, ubicación, imágenes, videos, descripciones, precios, planos, etc.).
            </li>
            <li>
              <strong>Información de pago:</strong> Datos de facturación procesados por Stripe (no
              almacenamos tarjetas de crédito).
            </li>
            <li>
              <strong>Comunicaciones:</strong> Emails, mensajes de soporte, feedback.
            </li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            2.2 Información que Recopilamos Automáticamente
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Datos de uso:</strong> Páginas visitadas, tiempo en sitio, clics, navegación.
            </li>
            <li>
              <strong>Datos técnicos:</strong> Dirección IP, tipo de navegador, dispositivo, sistema
              operativo, idioma.
            </li>
            <li>
              <strong>Cookies y tecnologías similares:</strong> Ver nuestra sección de Cookies más
              abajo.
            </li>
            <li>
              <strong>Logs de errores:</strong> Información técnica sobre errores para depuración
              (Sentry).
            </li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            2.3 Información de Visitantes de Microsites
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Leads:</strong> Información de contacto enviada por visitantes a través de
              formularios (nombre, email, teléfono, mensaje).
            </li>
            <li>
              <strong>Analytics:</strong> Visitas, páginas vistas, fuentes de tráfico (agregados y
              anónimos).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            3. Cómo Usamos tu Información
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Proveer el servicio:</strong> Crear y hospedar tus microsites, procesar pagos,
              dar soporte técnico.
            </li>
            <li>
              <strong>Mejorar la plataforma:</strong> Analizar uso, detectar bugs, desarrollar nuevas
              funcionalidades.
            </li>
            <li>
              <strong>Comunicación:</strong> Enviar notificaciones importantes, actualizaciones,
              newsletters (con opción de desuscripción).
            </li>
            <li>
              <strong>Seguridad:</strong> Detectar fraude, prevenir abusos, cumplir con leyes.
            </li>
            <li>
              <strong>Marketing (con tu consentimiento):</strong> Campañas de remarketing, publicidad
              personalizada.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            4. Cookies y Tecnologías de Seguimiento
          </h2>
          <p>Usamos cookies para mejorar tu experiencia. Tipos de cookies:</p>

          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>
              <strong>Necesarias:</strong> Esenciales para funcionamiento básico (autenticación,
              seguridad). Siempre activas.
            </li>
            <li>
              <strong>Analíticas:</strong> Vercel Analytics, Sentry para medir uso y rendimiento.
            </li>
            <li>
              <strong>Marketing:</strong> Meta Pixel, Google Tag Manager para publicidad
              personalizada. Requieren tu consentimiento.
            </li>
          </ul>

          <p className="mt-4">
            Puedes gestionar tus preferencias de cookies a través del banner que aparece en tu
            primera visita o contactándonos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            5. Compartir tu Información
          </h2>
          <p>No vendemos tu información personal. Compartimos datos solo con:</p>

          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>
              <strong>Proveedores de servicios:</strong> Supabase (base de datos), Vercel (hosting),
              Resend (emails), Stripe (pagos), Cloudflare (almacenamiento), Mapbox (mapas). Todos con
              contratos de confidencialidad.
            </li>
            <li>
              <strong>Requisitos legales:</strong> Si lo requiere la ley, orden judicial, o proteger
              nuestros derechos.
            </li>
            <li>
              <strong>Con tu consentimiento:</strong> En cualquier otro caso, solo con tu permiso
              explícito.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            6. Seguridad de los Datos
          </h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
          </p>

          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>Cifrado SSL/TLS para transmisión de datos</li>
            <li>Autenticación segura con Supabase Auth</li>
            <li>Rate limiting para prevenir ataques</li>
            <li>Monitoreo de seguridad con Sentry</li>
            <li>Backups automáticos diarios</li>
            <li>Auditoría de logs de acceso</li>
          </ul>

          <p className="mt-4">
            Sin embargo, ningún sistema es 100% seguro. Te recomendamos usar contraseñas fuertes y
            únicas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            7. Tus Derechos (GDPR y Leyes Locales)
          </h2>
          <p>Tienes derecho a:</p>

          <ul className="list-disc list-inside space-y-2 mt-4">
            <li>
              <strong>Acceso:</strong> Solicitar copia de tu información personal.
            </li>
            <li>
              <strong>Rectificación:</strong> Corregir datos inexactos.
            </li>
            <li>
              <strong>Eliminación:</strong> Solicitar borrado de tu cuenta y datos (&quot;derecho al
              olvido&quot;).
            </li>
            <li>
              <strong>Portabilidad:</strong> Exportar tus datos en formato estándar.
            </li>
            <li>
              <strong>Oposición:</strong> Oponerte a ciertos usos de tu información.
            </li>
            <li>
              <strong>Restricción:</strong> Limitar el procesamiento de tus datos.
            </li>
          </ul>

          <p className="mt-4">
            Para ejercer estos derechos, contáctanos en{" "}
            <a
              href="mailto:privacidad@noddo.io"
              className="text-[var(--site-primary)] hover:underline"
            >
              privacidad@noddo.io
            </a>
            . Responderemos en 30 días.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            8. Retención de Datos
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Cuentas activas:</strong> Mientras uses nuestro servicio.
            </li>
            <li>
              <strong>Cuentas canceladas:</strong> 90 días después de cancelación (para permitir
              reactivación), luego borrado permanente.
            </li>
            <li>
              <strong>Datos de facturación:</strong> 7 años por requisitos fiscales.
            </li>
            <li>
              <strong>Logs de seguridad:</strong> 1 año.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            9. Transferencias Internacionales
          </h2>
          <p>
            Tus datos pueden ser transferidos y procesados en servidores ubicados fuera de tu país
            (principalmente en Estados Unidos y Europa). Nos aseguramos de que todos los proveedores
            cumplan con GDPR y estándares de privacidad internacionales.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            10. Menores de Edad
          </h2>
          <p>
            NODDO no está dirigido a menores de 18 años. No recopilamos intencionalmente información
            de menores. Si descubres que un menor ha proporcionado información, contáctanos para
            eliminarla.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            11. Cambios a esta Política
          </h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos de cambios importantes
            por email. La fecha de &quot;Última actualización&quot; al inicio refleja la versión
            vigente.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            12. Contacto
          </h2>
          <p>Para preguntas sobre esta política o ejercer tus derechos:</p>

          <div className="mt-4 p-4 rounded-lg bg-white/3 border border-white/10">
            <p className="font-semibold text-white mb-2">NODDO - Equipo de Privacidad</p>
            <p>Email: <a href="mailto:privacidad@noddo.io" className="text-[var(--site-primary)] hover:underline">privacidad@noddo.io</a></p>
            <p>Soporte: <a href="mailto:hola@noddo.io" className="text-[var(--site-primary)] hover:underline">hola@noddo.io</a></p>
            <p>Web: <a href="https://noddo.io" className="text-[var(--site-primary)] hover:underline">noddo.io</a></p>
          </div>
        </section>
      </div>
    </article>
  );
}
