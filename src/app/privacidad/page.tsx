export const metadata = {
  title: 'Política de Privacidad · Estudio Bíblico Pro',
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen px-4 py-12" style={{ background: 'var(--navy)' }}>
      <div className="card mx-auto" style={{ maxWidth: 720 }}>
        <h1 className="section-title" style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>
          Política de Privacidad
        </h1>
        <p className="text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          Última actualización: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-5 text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>1. Responsable del tratamiento</h2>
            <p>
              Estudio Bíblico Pro es operado de forma independiente. Para cualquier consulta sobre tus
              datos personales puedes escribir por WhatsApp al +57 322 730 7125.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>2. Qué datos recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Correo electrónico y, si inicias sesión con Google, tu nombre y foto de perfil públicos de esa cuenta.</li>
              <li>Contraseña (si te registras con correo/contraseña), almacenada de forma cifrada por Supabase.</li>
              <li>Historial de uso: número de consultas realizadas por día, y estado de tu plan (gratis, Premium, admin).</li>
              <li>Los pasajes y preguntas que consultas, para poder mostrarte tu biblioteca de estudios guardados y aplicar la caché de consultas repetidas.</li>
              <li>Si activas Premium: la fecha de vencimiento de tu plan. No almacenamos números de tarjeta ni datos bancarios, porque los pagos se coordinan manualmente por WhatsApp.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>3. Para qué usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear y mantener tu cuenta, y permitirte iniciar sesión.</li>
              <li>Controlar el límite diario de consultas según tu plan.</li>
              <li>Guardar tu biblioteca personal de estudios.</li>
              <li>Responder tus solicitudes de soporte o reembolso.</li>
              <li>Mejorar la aplicación (por ejemplo, qué pasajes se consultan más para optimizar la caché).</li>
            </ul>
            <p className="mt-2">No vendemos tus datos personales ni los usamos con fines publicitarios de terceros.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>4. Con quién compartimos datos</h2>
            <p>
              Usamos proveedores de servicio que procesan datos en nuestro nombre, únicamente para
              operar la app:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Supabase</strong>: autenticación y base de datos (correo, contraseña cifrada, perfil, uso).</li>
              <li><strong>Google (Gemini) y DeepSeek</strong>: reciben el texto de tu consulta (el pasaje o pregunta) para generar la respuesta de exégesis. No reciben tu correo ni datos de tu cuenta.</li>
            </ul>
            <p className="mt-2">No compartimos tus datos con nadie más, salvo que la ley nos obligue.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>5. Cuánto tiempo guardamos tus datos</h2>
            <p>
              Mientras tu cuenta esté activa. Si quieres eliminar tu cuenta y tus datos, escríbenos por
              WhatsApp y la eliminaremos en un plazo razonable, salvo la información que debamos
              conservar por obligación legal (por ejemplo, registros de pagos).
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>6. Tus derechos</h2>
            <p>
              De acuerdo con la Ley 1581 de 2012 de Colombia (protección de datos personales), puedes
              solicitar en cualquier momento: acceder a tus datos, corregirlos, actualizarlos o
              solicitar su eliminación ("derecho al olvido"), escribiendo al WhatsApp de contacto.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>7. Seguridad</h2>
            <p>
              Tu contraseña se almacena cifrada y la comunicación con la app viaja cifrada (HTTPS). Aun
              así, ningún sistema es 100% invulnerable; te recomendamos usar una contraseña única para
              esta app.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>8. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política. Los cambios relevantes se anunciarán dentro de la app.
            </p>
          </section>

          <section>
            <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>9. Contacto</h2>
            <p>Para cualquier duda sobre tus datos: WhatsApp +57 322 730 7125.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
