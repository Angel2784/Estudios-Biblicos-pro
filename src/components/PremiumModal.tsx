'use client'

import React from 'react'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Contenido Premium</h2>
        <p className="text-gray-600 text-sm">
          Esta función está disponible para usuarios con acceso especial. 
        </p>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
