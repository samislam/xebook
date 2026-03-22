'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/shadcnui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/shadcnui/input'
import { Button } from '@/components/ui/shadcnui/button'
import { Dialog } from '@/components/ui/shadcnui/dialog'
import { InputField } from '@/components/common/input-field'
import { DialogTitle } from '@/components/ui/shadcnui/dialog'
import { DialogHeader } from '@/components/ui/shadcnui/dialog'
import { DialogFooter } from '@/components/ui/shadcnui/dialog'
import { DialogContent } from '@/components/ui/shadcnui/dialog'
import { DialogDescription } from '@/components/ui/shadcnui/dialog'
import { createCycleSchema, type CreateCycleFormValues } from '../schemas/create-cycle.schema'

type CreateCycleDialogProps = {
  open: boolean
  defaultName: string
  errorMessage: string | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateCycleFormValues) => void
}

export const CreateCycleDialog = ({
  open,
  defaultName,
  errorMessage,
  isSaving,
  onOpenChange,
  onSubmit,
}: CreateCycleDialogProps) => {
  const form = useForm<CreateCycleFormValues>({
    resolver: zodResolver(createCycleSchema),
    defaultValues: {
      name: defaultName,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ name: defaultName })
    }
  }, [defaultName, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create cycle</DialogTitle>
          <DialogDescription>Group multiple trades under one cycle.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <InputField
              control={form.control}
              name="name"
              label="Cycle name"
              render={(field) => (
                <Input
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  placeholder={defaultName}
                />
              )}
            />
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
