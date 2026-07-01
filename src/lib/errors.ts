const DEFAULT_ERROR_MESSAGE =
  'Something went wrong. Please try again or contact us at support@justbecausejewelry.com'

const CONNECTION_ERROR_MESSAGE =
  'We are having trouble connecting. Please check your internet connection and try again.'

const ALREADY_REGISTERED_MESSAGE =
  'It looks like you already have an account with us. Sign in instead, or reset your password if you have forgotten it.'

const PASSWORD_RESET_NEUTRAL_MESSAGE =
  'If an account exists with that email, we will send you a reset link shortly.'

export function getErrorText(error: unknown): string {
  if (typeof error === 'string') return error

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>

    if (typeof record.message === 'string') return record.message
    if (typeof record.error === 'string') return record.error
    if (typeof record.code === 'string') return record.code
  }

  return ''
}

function getErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const record = error as Record<string, unknown>
  return typeof record.code === 'string' ? record.code.toLowerCase() : ''
}

export function isAlreadyRegisteredError(error: unknown): boolean {
  const message = getErrorText(error).toLowerCase()
  const code = getErrorCode(error)

  return (
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already registered') ||
    message.includes('user already exists') ||
    code === 'user_already_exists'
  )
}

export function getAuthErrorMessage(error: unknown): string {
  const message = getErrorText(error).toLowerCase()
  const code = getErrorCode(error)

  if (isAlreadyRegisteredError(error)) {
    return ALREADY_REGISTERED_MESSAGE
  }

  if (
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    code === 'invalid_credentials'
  ) {
    return 'The email or password you entered is incorrect. Please try again.'
  }

  if (message.includes('email not confirmed') || message.includes('not confirmed')) {
    return 'Please check your email and click the confirmation link we sent you before signing in.'
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('too many attempts') ||
    message.includes('too many codes') ||
    code === 'over_request_rate_limit'
  ) {
    return 'Too many attempts. Please wait a few minutes before trying again.'
  }

  if (
    message.includes('invalid email') ||
    message.includes('unable to validate email') ||
    message.includes('invalid format') ||
    message.includes('email address')
  ) {
    return 'Please enter a valid email address.'
  }

  if (message.includes('password') && message.includes('characters')) {
    return 'Please choose a password that is at least 6 characters long.'
  }

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('connection')
  ) {
    return CONNECTION_ERROR_MESSAGE
  }

  if (message.includes('user not found') || message.includes('no user found')) {
    return 'We could not find an account with that email address.'
  }

  if (message.includes('verification code') || message.includes('otp') || message.includes('expired')) {
    return 'That code is not valid anymore. Please check the code or request a new one.'
  }

  if (message.includes('signup') || message.includes('register') || message.includes('createuser')) {
    return DEFAULT_ERROR_MESSAGE
  }

  return DEFAULT_ERROR_MESSAGE
}

export function getPasswordResetMessage(): string {
  return PASSWORD_RESET_NEUTRAL_MESSAGE
}

export function getCheckoutErrorMessage(error: unknown): string {
  const message = getErrorText(error).toLowerCase()

  if (message.includes('card')) {
    return 'Your card was declined. Please check your details or try a different card.'
  }

  if (message.includes('insufficient')) {
    return 'Your card has insufficient funds. Please try a different card.'
  }

  if (message.includes('expired')) {
    return 'Your card has expired. Please update your payment details.'
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'We are having trouble processing your payment. Please try again.'
  }

  return 'We could not process your payment. Please try again or contact us at support@justbecausejewelry.com'
}

export function getGeneralErrorMessage(_error?: unknown): string {
  return DEFAULT_ERROR_MESSAGE
}

export async function readFriendlyApiError(
  response: Response,
  mapper: (error: unknown) => string = getGeneralErrorMessage
): Promise<string> {
  const body: unknown = await response.json().catch(() => null)

  if (body && typeof body === 'object' && 'error' in body) {
    return mapper((body as { error?: unknown }).error)
  }

  return mapper(body)
}
