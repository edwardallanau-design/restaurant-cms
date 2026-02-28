import { Resend } from 'resend'
import { env } from '@/env'

/**
 * Resend client instance — initialised once and reused.
 * Only import this on the server side (Server Actions, Route Handlers).
 */
export const resend = new Resend(env.RESEND_API_KEY)

export interface ContactEmailPayload {
  name: string
  email: string
  phone?: string
  message: string
  subject?: string
}

/**
 * Sends a contact form submission to the restaurant owner via Resend.
 */
export async function sendContactEmail(data: ContactEmailPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: env.RESEND_TO_EMAIL,
      replyTo: data.email,
      subject: data.subject ?? `New contact form message from ${data.name}`,
      html: buildContactEmailHtml(data),
    })

    if (error) {
      console.error('[sendContactEmail] Resend error:', error)
      return { success: false, error: 'Failed to send email. Please try again.' }
    }

    return { success: true }
  } catch (err) {
    console.error('[sendContactEmail] Unexpected error:', err)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

function buildContactEmailHtml(data: ContactEmailPayload): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
    <body style="font-family: system-ui, -apple-system, sans-serif; background: #f9f9f9; padding: 32px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h1 style="font-size: 20px; color: #111; margin-bottom: 24px;">New Contact Form Submission</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555; width: 100px;">Name</td>
            <td style="padding: 8px 0; color: #111;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color: #2563eb;">${escapeHtml(data.email)}</a></td>
          </tr>
          ${data.phone ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #555;">Phone</td>
            <td style="padding: 8px 0; color: #111;">${escapeHtml(data.phone)}</td>
          </tr>` : ''}
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <h2 style="font-size: 16px; color: #555; margin-bottom: 12px;">Message</h2>
        <p style="color: #111; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.message)}</p>
      </div>
    </body>
    </html>
  `
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
