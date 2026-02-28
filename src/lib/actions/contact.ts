'use server'

import { z } from 'zod'
import { sendContactEmail } from '@/lib/email'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().max(30).optional(),
  subject: z.string().max(150).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
})

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  errors?: Partial<Record<keyof z.infer<typeof contactSchema>, string[]>>
  message?: string
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') ?? undefined,
    subject: formData.get('subject') ?? undefined,
    message: formData.get('message'),
  }

  // Validate
  const result = contactSchema.safeParse(rawData)
  if (!result.success) {
    return {
      status: 'error',
      errors: result.error.flatten().fieldErrors as ContactFormState['errors'],
    }
  }

  // Send email
  const emailResult = await sendContactEmail({
    name: result.data.name,
    email: result.data.email,
    phone: result.data.phone,
    subject: result.data.subject,
    message: result.data.message,
  })

  if (!emailResult.success) {
    return {
      status: 'error',
      message: emailResult.error ?? 'Failed to send message. Please try again.',
    }
  }

  return {
    status: 'success',
    message: "Thank you for your message! We'll be in touch shortly.",
  }
}
