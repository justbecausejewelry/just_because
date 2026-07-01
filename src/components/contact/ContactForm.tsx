"use client"

import { FormEvent, useMemo, useState } from 'react'

const subjectOptions = [
  'General Inquiry',
  'Order Support',
  'Custom Ring Builder',
  'Returns & Exchanges',
  'Sizing Help',
  'Other',
]

type FormFields = {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

type FormErrors = Partial<Record<keyof FormFields | 'form', string>>
type ContactResponse = {
  delivered?: boolean
  error?: string
  message?: string
  success?: boolean
}

const initialFields: FormFields = {
  firstName: '',
  lastName: '',
  email: '',
  subject: subjectOptions[0],
  message: '',
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateFields(fields: FormFields) {
  const nextErrors: FormErrors = {}

  if (!fields.firstName.trim()) {
    nextErrors.firstName = 'First name is required.'
  }

  if (!fields.lastName.trim()) {
    nextErrors.lastName = 'Last name is required.'
  }

  if (!fields.email.trim()) {
    nextErrors.email = 'Email is required.'
  } else if (!validateEmail(fields.email.trim())) {
    nextErrors.email = 'Enter a valid email address.'
  }

  if (!fields.subject.trim()) {
    nextErrors.subject = 'Subject is required.'
  }

  if (!fields.message.trim()) {
    nextErrors.message = 'Message is required.'
  } else if (fields.message.trim().length < 20) {
    nextErrors.message = 'Message must be at least 20 characters.'
  }

  return nextErrors
}

export function ContactForm() {
  const [fields, setFields] = useState<FormFields>(initialFields)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const characterCount = useMemo(() => fields.message.trim().length, [fields.message])

  function updateField(field: keyof FormFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field] && !current.form) return current
      const { [field]: _fieldError, form: _formError, ...remaining } = current
      void _fieldError
      void _formError
      return remaining
    })
    setSuccessMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSuccessMessage('')

    const nextErrors = validateFields(fields)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim(),
          subject: fields.subject.trim(),
          message: fields.message.trim(),
        }),
      })
      const payload = (await response.json().catch(() => null)) as ContactResponse | null

      if (!response.ok || !payload?.success) {
        setErrors({ form: payload?.error || `Submission failed with status ${response.status}. Please try again.` })
        return
      }

      setFields(initialFields)
      setSuccessMessage(payload.message || 'Thank you. Your message was sent, and we will be in touch within 24 hours.')
    } catch (error) {
      console.error('[contact-form] submission failed:', error)
      setErrors({ form: 'Submission failed. Please try again or email support@justbecausejewelry.com.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="firstName">First Name</label>
          <input
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            aria-invalid={Boolean(errors.firstName)}
            id="firstName"
            name="firstName"
            onChange={(event) => updateField('firstName', event.target.value)}
            required
            type="text"
            value={fields.firstName}
          />
          {errors.firstName ? <span id="firstName-error">{errors.firstName}</span> : null}
        </div>

        <div className="contact-field">
          <label htmlFor="lastName">Last Name</label>
          <input
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            aria-invalid={Boolean(errors.lastName)}
            id="lastName"
            name="lastName"
            onChange={(event) => updateField('lastName', event.target.value)}
            required
            type="text"
            value={fields.lastName}
          />
          {errors.lastName ? <span id="lastName-error">{errors.lastName}</span> : null}
        </div>
      </div>

      <div className="contact-field">
        <label htmlFor="email">Email</label>
        <input
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={Boolean(errors.email)}
          id="email"
          name="email"
          onChange={(event) => updateField('email', event.target.value)}
          required
          type="email"
          value={fields.email}
        />
        {errors.email ? <span id="email-error">{errors.email}</span> : null}
      </div>

      <div className="contact-field">
        <label htmlFor="subject">Subject</label>
        <select
          aria-describedby={errors.subject ? 'subject-error' : undefined}
          aria-invalid={Boolean(errors.subject)}
          id="subject"
          name="subject"
          onChange={(event) => updateField('subject', event.target.value)}
          required
          value={fields.subject}
        >
          {subjectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.subject ? <span id="subject-error">{errors.subject}</span> : null}
      </div>

      <div className="contact-field">
        <label htmlFor="message">Message</label>
        <textarea
          aria-describedby={errors.message ? 'message-error' : 'message-help'}
          aria-invalid={Boolean(errors.message)}
          id="message"
          minLength={20}
          name="message"
          onChange={(event) => updateField('message', event.target.value)}
          required
          rows={7}
          value={fields.message}
        />
        {errors.message ? (
          <span id="message-error">{errors.message}</span>
        ) : (
          <span id="message-help">{characterCount}/20 minimum characters</span>
        )}
      </div>

      {successMessage ? <div className="contact-success">{successMessage}</div> : null}
      {errors.form ? <div className="contact-error">{errors.form}</div> : null}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
      </button>
    </form>
  )
}
