import { checkRateLimit as checkServerRateLimit } from '@/lib/server/rateLimit'

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const result = checkServerRateLimit({
    key,
    limit,
    windowMs: windowSeconds * 1000,
  })

  return {
    allowed: result.ok,
    remaining: result.remaining,
  }
}
