'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { appApi } from '@/lib/elysia/eden'
import { pageDefs } from '@/config/pages.config'
import { useMutation } from '@tanstack/react-query'
import { Form } from '@/components/ui/shadcnui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/shadcnui/input'
import { useRouter } from '@/lib/next-intl/navigation'
import { Button } from '@/components/ui/shadcnui/button'
import { InputField } from '@/components/common/input-field'

const loginFormSchema = z.object({
  password: z.string().trim().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export const LoginForm = () => {
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      password: '',
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { error } = await appApi.auth.login.post({ password: values.password })
      if (error) {
        throw new Error((error.value as { error?: string } | null)?.error ?? 'Login failed')
      }
    },
    onSuccess: () => {
      router.push(pageDefs.tradebook.href)
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    loginMutation.reset()
    await loginMutation.mutateAsync(values)
  }

  return (
    <section className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Login</h1>
      <p className="text-muted-foreground mt-1 text-sm">Enter your password to continue.</p>

      <Form {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <InputField
            control={form.control}
            name="password"
            label="Password"
            render={(field) => (
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
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
