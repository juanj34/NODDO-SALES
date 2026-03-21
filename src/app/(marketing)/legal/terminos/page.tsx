import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio - NODDO",
  description:
    "Términos y condiciones de uso de NODDO - Derechos, obligaciones y políticas de la plataforma.",
};

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-invert prose-headings:font-site-heading max-w-none">
      <h1 className="text-4xl font-site-heading font-light text-white mb-2">
        Términos de Servicio
      </h1>
      <p className="text-[var(--text-tertiary)] text-sm mb-8">
        Última actualización: {new Date().toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="space-y-8 text-[var(--text-secondary)] leading-relaxed">
        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            1. Aceptación de los Términos
          </h2>
          <p>
            Bienvenido a NODDO. Al acceder o usar nuestra plataforma, aceptas estar legalmente
            vinculado por estos Términos de Servicio (&quot;Términos&quot;). Si no estás de acuerdo,
            no uses NODDO.
          </p>
          <p>
            Estos Términos constituyen un acuerdo legal entre tú (&quot;Usuario&quot;, &quot;Cliente&quot; o
            &quot;tú&quot;) y NODDO (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Plataforma&quot;).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            2. Descripción del Servicio
          </h2>
          <p>
            NODDO es una plataforma SaaS (Software as a Service) que permite a desarrolladores
            inmobiliarios crear, personalizar y publicar microsites premium para mostrar sus
            proyectos.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            2.1 Funcionalidades
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Editor de proyectos inmobiliarios (tipologías, galería, videos, planos, ubicación)</li>
            <li>Generación automática de microsites públicos con dominio personalizado</li>
            <li>Sistema de gestión de leads y contactos</li>
            <li>Analytics de visitantes y conversiones</li>
            <li>Almacenamiento de imágenes, videos y tours 360°</li>
            <li>Integración con WhatsApp y sistemas CRM</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            2.2 Disponibilidad
          </h3>
          <p>
            Nos esforzamos por mantener NODDO disponible 24/7, pero no garantizamos uptime del 100%.
            Podemos suspender el servicio temporalmente por mantenimiento, actualizaciones o
            emergencias técnicas.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            3. Registro y Cuenta
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            3.1 Elegibilidad
          </h3>
          <p>
            Debes tener al menos 18 años y capacidad legal para celebrar contratos. Al registrarte,
            garantizas que la información proporcionada es veraz y actualizada.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            3.2 Seguridad de la Cuenta
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Eres responsable de mantener tu contraseña segura y confidencial.</li>
            <li>Debes notificarnos inmediatamente de cualquier acceso no autorizado.</li>
            <li>Eres responsable de toda actividad bajo tu cuenta.</li>
            <li>No puedes compartir tu cuenta con terceros sin autorización.</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            3.3 Cuentas Corporativas
          </h3>
          <p>
            Si te registras en nombre de una empresa, garantizas tener autoridad para vincularla a
            estos Términos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            4. Planes y Pagos
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            4.1 Planes de Suscripción
          </h3>
          <p>
            Ofrecemos diferentes planes (Proyecto, Studio, Enterprise) con distintas funcionalidades
            y límites. Los detalles de cada plan están en nuestra{" "}
            <Link href="/#pricing" className="text-[var(--site-primary)] hover:underline">
              página de precios
            </Link>
            .
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            4.2 Facturación
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>Las suscripciones se cobran mensual o anualmente según tu plan.</li>
            <li>Los pagos se procesan automáticamente a través de Stripe.</li>
            <li>Todos los precios están en USD (o moneda local si aplica).</li>
            <li>Los impuestos aplicables se añadirán según tu ubicación.</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            4.3 Renovación Automática
          </h3>
          <p>
            Tu suscripción se renueva automáticamente al final de cada período, a menos que la
            canceles antes de la fecha de renovación.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            4.4 Reembolsos
          </h3>
          <p>
            Ofrecemos garantía de reembolso de 14 días para nuevos clientes. Después de este período,
            no se otorgan reembolsos por suscripciones canceladas (pero conservas acceso hasta el
            final del período pagado).
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            4.5 Cambios de Precio
          </h3>
          <p>
            Nos reservamos el derecho de cambiar precios con 30 días de anticipación. Los cambios no
            afectan períodos ya pagados.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            5. Uso Aceptable
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            5.1 Uso Permitido
          </h3>
          <p>Puedes usar NODDO únicamente para:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Crear y publicar microsites de proyectos inmobiliarios legítimos.</li>
            <li>Gestionar leads y contactos de tus proyectos.</li>
            <li>Promocionar tus desarrollos inmobiliarios.</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            5.2 Uso Prohibido
          </h3>
          <p>NO puedes usar NODDO para:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Publicar contenido ilegal, fraudulento, engañoso o difamatorio.</li>
            <li>Violar derechos de propiedad intelectual de terceros.</li>
            <li>Distribuir malware, spam o contenido malicioso.</li>
            <li>Realizar ingeniería inversa de la plataforma.</li>
            <li>Sobrecargar o atacar nuestros servidores.</li>
            <li>Revender o redistribuir el servicio sin autorización.</li>
            <li>Violar leyes locales, nacionales o internacionales.</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            5.3 Consecuencias
          </h3>
          <p>
            Nos reservamos el derecho de suspender o terminar tu cuenta si violas estos términos, sin
            reembolso.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            6. Propiedad Intelectual
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            6.1 Tu Contenido
          </h3>
          <p>
            Conservas todos los derechos sobre el contenido que subes (imágenes, videos, textos,
            logos). Nos otorgas una licencia mundial, no exclusiva, libre de regalías para
            almacenar, procesar y mostrar tu contenido en los microsites.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            6.2 Nuestro Contenido
          </h3>
          <p>
            NODDO, su logo, diseño, código, y todas las funcionalidades son propiedad de NODDO y
            están protegidos por derechos de autor y otras leyes de propiedad intelectual.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            6.3 Feedback
          </h3>
          <p>
            Si nos proporcionas ideas, sugerencias o feedback, nos concedes el derecho de usarlas
            libremente sin compensación.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            7. Privacidad y Datos
          </h2>
          <p>
            Tu privacidad es importante. Lee nuestra{" "}
            <a
              href="/legal/privacidad"
              className="text-[var(--site-primary)] hover:underline"
            >
              Política de Privacidad
            </a>{" "}
            para entender cómo manejamos tus datos.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            7.1 Exportación de Datos
          </h3>
          <p>
            Puedes exportar tu contenido en cualquier momento desde el panel de control. Al cancelar,
            tienes 30 días para exportar antes de que se elimine permanentemente.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            8. Limitación de Responsabilidad
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            8.1 &quot;AS IS&quot;
          </h3>
          <p>
            NODDO se proporciona &quot;tal cual&quot; y &quot;según disponibilidad&quot;, sin garantías de ningún
            tipo, expresas o implícitas.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            8.2 Exclusión de Daños
          </h3>
          <p>
            En la medida permitida por la ley, NODDO no será responsable de daños indirectos,
            incidentales, especiales, consecuentes o punitivos, incluyendo pérdida de ganancias,
            datos o uso.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            8.3 Límite Máximo
          </h3>
          <p>
            Nuestra responsabilidad total no excederá el monto que pagaste en los 12 meses
            anteriores.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            9. Indemnización
          </h2>
          <p>
            Aceptas indemnizar y eximir de responsabilidad a NODDO de cualquier reclamación,
            pérdida o daño (incluyendo honorarios legales) derivados de:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Tu uso de la plataforma.</li>
            <li>Tu violación de estos Términos.</li>
            <li>Tu violación de derechos de terceros.</li>
            <li>Contenido que publiques en tu microsite.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            10. Terminación
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            10.1 Por Ti
          </h3>
          <p>
            Puedes cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.
            La cancelación es efectiva al final del período de facturación actual.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            10.2 Por Nosotros
          </h3>
          <p>Podemos terminar tu cuenta inmediatamente si:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Violas estos Términos.</li>
            <li>Tu pago falla repetidamente.</li>
            <li>Usas la plataforma de manera abusiva.</li>
            <li>Por razones legales o de seguridad.</li>
          </ul>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            10.3 Efecto de la Terminación
          </h3>
          <p>
            Al terminar: (1) tu acceso cesará inmediatamente, (2) tus microsites se despublicarán,
            (3) tus datos se eliminarán después de 30 días.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            11. Modificaciones
          </h2>
          <p>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Te
            notificaremos de cambios materiales por email o mediante aviso en la plataforma. El uso
            continuado después de cambios constituye aceptación.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            12. Ley Aplicable
          </h2>
          <p>
            Estos Términos se rigen por las leyes de [tu jurisdicción]. Cualquier disputa se
            resolverá en los tribunales de [tu ciudad/país].
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            13. Miscelánea
          </h2>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            13.1 Acuerdo Completo
          </h3>
          <p>
            Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo
            entre tú y NODDO.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            13.2 Divisibilidad
          </h3>
          <p>
            Si alguna disposición es inválida, el resto permanece en efecto.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            13.3 No Renuncia
          </h3>
          <p>
            Nuestra falta de ejercicio de un derecho no constituye una renuncia a ese derecho.
          </p>

          <h3 className="text-xl font-site-heading font-light text-white mt-8 mb-3">
            13.4 Asignación
          </h3>
          <p>
            No puedes transferir estos Términos sin nuestro consentimiento. Nosotros podemos
            transferirlos libremente.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-site-heading font-light text-white mt-12 mb-4">
            14. Contacto
          </h2>
          <p>Para preguntas sobre estos Términos:</p>

          <div className="mt-4 p-4 rounded-lg bg-white/3 border border-white/10">
            <p className="font-semibold text-white mb-2">NODDO - Soporte Legal</p>
            <p>Email: <a href="mailto:legal@noddo.io" className="text-[var(--site-primary)] hover:underline">legal@noddo.io</a></p>
            <p>Soporte: <a href="mailto:hola@noddo.io" className="text-[var(--site-primary)] hover:underline">hola@noddo.io</a></p>
            <p>Web: <a href="https://noddo.io" className="text-[var(--site-primary)] hover:underline">noddo.io</a></p>
          </div>
        </section>

        <div className="mt-12 p-6 rounded-lg bg-[var(--site-primary)]/10 border border-[var(--site-primary)]/20">
          <p className="text-white font-semibold mb-2">
            Al usar NODDO, confirmas que has leído, entendido y aceptado estos Términos de Servicio.
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            Si tienes dudas, contáctanos antes de usar la plataforma.
          </p>
        </div>
      </div>
    </article>
  );
}
