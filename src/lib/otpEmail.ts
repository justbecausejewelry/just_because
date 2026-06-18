import { getResendClient } from '@/lib/email/resend'
import { EMAIL_SENDERS } from '@/lib/email/senders'

export const OTP_WINDOW_MINUTES = 10

type SendBrandedOtpEmailOptions = {
  to: string
  code: string
  name?: string
  subject: string
  eyebrow: string
  heading: string
  message: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function brandedOtpEmailHtml({
  code,
  name,
  eyebrow,
  heading,
  message,
}: Omit<SendBrandedOtpEmailOptions, 'to' | 'subject'>) {
  const safeName = escapeHtml(name?.trim() || 'there')
  const safeEyebrow = escapeHtml(eyebrow)
  const safeHeading = escapeHtml(heading)
  const safeMessage = escapeHtml(message)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Just Because code</title>
  </head>
  <body style="margin:0;background:#FBF5F0;color:#1A1014;font-family:Jost,Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FBF5F0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FDF8F2;border:1px solid #EDD9AF;">
            <tr>
              <td style="padding:34px 34px 10px;text-align:center;">
                <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;line-height:1;color:#C9A961;font-style:italic;">Just Because</div>
                <div style="margin:12px auto 0;width:42px;height:1px;background:#C9A961;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 34px 8px;text-align:center;">
                <p style="margin:0 0 10px;color:#C9A961;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;">${safeEyebrow}</p>
                <h1 style="margin:0;color:#1A1014;font-family:'Cormorant Garamond',Georgia,serif;font-size:34px;font-weight:400;line-height:1.1;">${safeHeading}</h1>
                <p style="margin:18px 0 0;color:#B8A090;font-size:14px;line-height:1.7;">Hi ${safeName}, ${safeMessage} It expires in ${OTP_WINDOW_MINUTES} minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 34px;text-align:center;">
                <div style="display:inline-block;background:#1A1014;color:#FBF5F0;border:1px solid #C9A961;padding:18px 28px;font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;letter-spacing:0.28em;line-height:1;">${code}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 34px 34px;text-align:center;">
                <p style="margin:0;color:#B8A090;font-size:12px;line-height:1.7;">If you did not request this code, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendBrandedOtpEmail(options: SendBrandedOtpEmailOptions) {
  const { data, error } = await getResendClient().emails.send({
    from: EMAIL_SENDERS.noreply,
    to: options.to,
    subject: options.subject,
    html: brandedOtpEmailHtml(options),
  })

  if (!error) {
    console.log('[resend] otp email accepted:', {
      to: options.to,
      subject: options.subject,
      id: data?.id || 'unknown',
    })
    return { ok: true, error: '' }
  }

  return { ok: false, error: error.message || 'Unable to send verification email' }
}
