'use client'

import { UserButton, useUser } from '@clerk/nextjs'
// ... resto de tus imports

export default function Home() {
  const { user, isLoaded } = useUser()
  // ... resto de tu lógica de estado

  // En tu JSX, usa <UserButton /> donde antes estaba tu botón de perfil
