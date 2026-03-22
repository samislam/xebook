'use client'

import { useForm } from 'react-hook-form'
import { appApi } from '@/lib/elysia/eden'
import { pageDefs } from '@/config/pages.config'
import { useMutation } from '@tanstack/react-query'
import { Form } from '@/components/ui/shadcnui/form'
import { Input } from '@/components/ui/shadcnui/input'
import { useRouter } from '@/lib/next-intl/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { InputField } from '@/components/common/input-field'
import type { LoginValues } from '@/app/api/[[...slugs]]/auth/auth.schemas'

export const LoginForm = () => {
  const router = useRouter()

  const form = useForm<LoginValues>({
    defaultValues: DEFAULT_VALUES,
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const { error } = await appApi.auth.login.post({
        username: values.username,
        password: values.password,
      })
      if (error) {
        throw new Error((error.value as { error?: string } | null)?.error ?? 'Login failed')
      }
    },
    onSuccess: () => {
      router.push(pageDefs.tradebook.href)
    },
  })

  const onSubmit = async (values: LoginValues) => {
    loginMutation.reset()
    await loginMutation.mutateAsync(values)
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Enter your username and password to continue.
      </p>

      <Form {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <InputField
            required
            name="username"
            label="Username"
            control={form.control}
            render={(field) => (
              <Input {...field} value={field.value ?? ''} id={field.name} autoComplete="username" />
            )}
          />

          <InputField
            required
            name="password"
            label="Password"
            control={form.control}
            render={(field) => (
              <Input
                {...field}
                type="password"
                id={field.name}
                value={field.value ?? ''}
                autoComplete="current-password"
              />
            )}
          />

          {loginMutation.error && (
            <p className="text-sm text-red-600">{loginMutation.error.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
    </section>
  )
}

const DEFAULT_VALUES: LoginValues = {
  username: '',
  password: '',
}
