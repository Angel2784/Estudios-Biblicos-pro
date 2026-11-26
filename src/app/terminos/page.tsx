export const metadata = {
  title: 'Términos y Condiciones · Estudio Bíblico Pro',
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen px-4 py-12" style={{ background: 'var(--navy)' }}>
      <div className="card mx-auto" style={{ maxWidth: 720 }}>
        <h1 className="section-title" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>
          Términos y Condiciones de Uso
        </h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-5 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>1. Qué es Estudio Bíblico Pro</h2>
            <p>
              Estudio Bíblico Pro es una herramienta de apoyo al estudio personal de las Escrituras que
              utiliza inteligencia artificial (IA) para generar exégesis, comparaciones de pasajes y
              material de estudio. El contenido generado tiene fines educativos y devocionales.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>2. Naturaleza del contenido generado por IA</h2>
            <p>
              Todo el contenido de exégesis, comparación y estudio es generado automáticamente por
              modelos de inteligencia artificial (Gemini y/o DeepSeek). Aunque procuramos que las
              respuestas sean rigurosas, la IA puede cometer errores, omitir matices o presentar
              interpretaciones incompletas. Este contenido <strong>no reemplaza</strong> el consejo
              pastoral, la formación teológica formal ni el estudio directo de fuentes académicas y
              eclesiásticas reconocidas. El usuario es responsable de contrastar la información antes
              de usarla en contextos de enseñanza, predicación o publicación.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>3. Cuentas de usuario</h2>
            <p>
              Para usar la aplicación debes crear una cuenta (correo/contraseña o Google). Eres
              responsable de mantener la confidencialidad de tus credenciales y de toda actividad
              realizada desde tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>4. Plan gratuito y plan Premium</h2>
            <p>
              La cuenta gratuita incluye un número limitado de consultas diarias. El plan Premium
              amplía ese límite diario bajo una Política de Uso Justo, mediante pago periódico
              (mensual o anual).
            </p>
            <p className="mt-2">
              <strong>Método de pago:</strong> actualmente los pagos se realizan de forma manual por
              Nequi, Daviplata o Bre-B, y se confirman por WhatsApp al número indicado dentro de la
              app. La activación del plan Premium se realiza manualmente tras confirmarse el pago,
              generalmente el mismo día.
            </p>
            <p className="mt-2">
              <strong>Renovación:</strong> el plan Premium no se renueva automáticamente. Al vencer el
              periodo pagado, la cuenta vuelve al plan gratuito hasta que se realice un nuevo pago.
            </p>
            <p className="mt-2">
              <strong>Reembolsos:</strong> puedes solicitar el reembolso dentro de las primeras 48
              horas después del pago si no has hecho uso significativo del plan Premium, escribiendo
              al WhatsApp de soporte. Pasado ese plazo, o si el plan ya fue usado activamente, el pago
              no es reembolsable.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>5. Uso aceptable</h2>
            <p>No está permitido:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Usar la aplicación para generar o difundir contenido de odio, difamatorio o ilegal.</li>
              <li>Revender, redistribuir o compartir el acceso a tu cuenta Premium con terceros.</li>
              <li>Intentar vulnerar los límites de uso, la autenticación o la infraestructura de la app.</li>
              <li>Usar herramientas automatizadas (bots) para extraer contenido de forma masiva.</li>
            </ul>
            <p className="mt-2">Podemos suspender cuentas que incumplan estas condiciones.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>6. Disponibilidad del servicio</h2>
            <p>
              La app depende de proveedores externos (Supabase, Google Gemini, DeepSeek). No
              garantizamos disponibilidad ininterrumpida y no somos responsables por fallas originadas
              en esos proveedores.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>7. Cambios a estos términos</h2>
            <p>
              Podemos actualizar estos términos en cualquier momento. Los cambios importantes se
              notificarán dentro de la app. El uso continuado después de un cambio implica su
              aceptación.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>8. Contacto</h2>
            <p>
              Para dudas, soporte o solicitudes de reembolso, escríbenos por WhatsApp al
              +57 322 730 7125.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
