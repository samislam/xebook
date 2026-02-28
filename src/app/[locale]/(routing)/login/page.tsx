'use client'

import { useState } from 'react'
import { appApi } from '@/lib/elysia/eden'
import { Input } from '@/components/ui/shadcnui/input'
import { useRouter } from '@/lib/next-intl/navigation'
import { Button } from '@/components/ui/shadcnui/button'

const LoginPage = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)

    if (!password.trim()) {
      setErrorMessage('Password is required')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await appApi.auth.login.post({ password })
      if (error) {
        const message =
          typeof error.value === 'object' &&
          error.value &&
          'error' in error.value &&
          typeof error.value.error === 'string'
            ? error.value.error
            : 'Login failed'
        throw new Error(message)
      }

      router.push('/tradebook')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground mt-1 text-sm">Enter your password to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
