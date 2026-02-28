'use client'

import { useActionState } from 'react'
import { submitContactForm, type ContactFormState } from '@/lib/actions/contact'
import { Button } from '@/components/ui/Button'

const initialState: ContactFormState = { status: 'idle' }

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)

  if (state.status === 'success') {
    return (
      <div className="rounded-card border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-serif text-xl font-semibold text-green-800">Message Sent!</h3>
        <p className="mt-2 text-green-700">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* General error message */}
      {state.status === 'error' && state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Name + Email */}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Your Name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Jane Smith"
          errors={state.errors?.name}
        />
        <FormField
          label="Email Address"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="jane@example.com"
          errors={state.errors?.email}
        />
      </div>

      {/* Phone + Subject */}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          errors={state.errors?.phone}
        />
        <FormField
          label="Subject (optional)"
          name="subject"
          type="text"
          placeholder="Reservation inquiry"
          errors={state.errors?.subject}
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us how we can help..."
          className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            state.errors?.message ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
          }`}
        />
        {state.errors?.message && (
          <p className="text-xs text-red-600">{state.errors.message[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} size="lg" className="w-full sm:w-auto">
        {isPending ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  )
}

// ── FormField helper ──────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  name: string
  type: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  errors?: string[]
}

function FormField({ label, name, type, required, autoComplete, placeholder, errors }: FormFieldProps) {
  const hasError = Boolean(errors?.length)
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`w-full rounded-md border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
          hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
        }`}
      />
      {hasError && errors && <p className="text-xs text-red-600">{errors[0]}</p>}
    </div>
  )
}
