import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={null}>
        <AuthForm mode="sign-in" />
      </Suspense>
    </div>
  )
}
