/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que inserten tu web en un iframe de otra página (Anti-Clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Evita que el navegador intente adivinar el tipo MIME (Anti-MIME Sniffing)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controla qué información de origen se envía al navegar
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Restringe acceso a hardware innecesario (micrófono, cámara, ubicación)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
