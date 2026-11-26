// src/components/dashboard/HeroBanner.tsx
import Image from 'next/image'
import { getVersiculoDelDia } from '@/lib/versiculoDelDia'

export default function HeroBanner() {
  const versiculo = getVersiculoDelDia()

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#fed468]/25 shadow-xl">
      {/* Imagen de fondo a pantalla completa */}
      <div className="relative w-full h-56 sm:h-64 lg:h-72">
        <Image
          src="/images/banner-verso.jpg"
          alt="Estudio Bíblico Pro - Banner"
          fill
          className="object-cover"
          priority
        />
        {/* Degradado oscuro para legibilidad óptima */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Contenido superpuesto */}
        <div className="absolute inset-0 p-6 sm:p-8 lg:p-10 flex items-center">
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            {/* Lado Izquierdo: Título */}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-wide">
                <span className="text-white">Estudio </span>
                <span className="text-[#d4a029]">Bíblico </span>
                <span className="text-white">Pro</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-300 mt-2 max-w-md">
                Profundiza en la Palabra de Dios de manera Académica
              </p>
            </div>

            {/* Lado Derecho: Versículo del día (sin cuadro / sin borde) */}
            <div className="w-full sm:w-auto shrink-0 max-w-md text-center sm:text-right">
              <p className="text-xs sm:text-sm font-serif italic text-gray-100 leading-relaxed drop-shadow-md">
                &ldquo;{versiculo.texto}&rdquo;
              </p>
              <span className="block text-xs font-semibold text-[#d4a029] mt-2 drop-shadow">
                {versiculo.cita}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
