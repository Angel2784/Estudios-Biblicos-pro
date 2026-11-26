// src/app/sign-up/page.tsx
import AuthForm from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4">
      <AuthForm mode="sign-up" />
    </div>
  )
}
