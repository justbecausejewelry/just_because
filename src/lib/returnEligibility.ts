export type ReturnReason =
  | 'wrong_size'
  | 'not_as_expected'
  | 'damaged_defective'
  | 'changed_mind'
  | 'wrong_item_received'
  | 'quality_issue'

export type ReturnStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'item_received'
  | 'refunded'
  | 'closed'

export type EligibilityResult = {
  eligible: boolean
  reason?: string
  daysRemaining?: number
}

type ReturnOrderItem = {
  is_custom?: boolean
  isCustom?: boolean
  is_final_sale?: boolean
  isFinalSale?: boolean
  engraving?: string | null
  name?: string | null
  productTitle?: string | null
}

type ReturnOrder = {
  created_at?: string | null
  createdAt?: string | null
  status?: string | null
  items?: ReturnOrderItem[]
  OrderItem?: ReturnOrderItem[]
}

export const RETURN_REASONS: Array<{
  value: ReturnReason
  label: string
  description: string
}> = [
  {
    value: 'wrong_size',
    label: 'Wrong size',
    description: 'The item does not fit correctly',
  },
  {
    value: 'not_as_expected',
    label: 'Not as expected',
    description: 'The item looks different from photos',
  },
  {
    value: 'damaged_defective',
    label: 'Damaged or defective',
    description: 'The item arrived damaged or has a defect',
  },
  {
    value: 'changed_mind',
    label: 'Changed my mind',
    description: 'I no longer want this item',
  },
  {
    value: 'wrong_item_received',
    label: 'Wrong item received',
    description: 'I received a different item than ordered',
  },
  {
    value: 'quality_issue',
    label: 'Quality issue',
    description: 'The quality does not meet expectations',
  },
]

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: 'Under Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Not Approved',
  item_received: 'Item Received',
  refunded: 'Refunded',
  closed: 'Closed',
}

export function returnReasonLabel(reason: string | null | undefined) {
  return RETURN_REASONS.find((item) => item.value === reason)?.label || 'Return request'
}

export function isReturnReason(value: string): value is ReturnReason {
  return RETURN_REASONS.some((reason) => reason.value === value)
}

export function normalizeReturnStatus(value: string | null | undefined): ReturnStatus {
  if (
    value === 'requested'
    || value === 'under_review'
    || value === 'approved'
    || value === 'rejected'
    || value === 'item_received'
    || value === 'refunded'
    || value === 'closed'
  ) {
    return value
  }

  return 'requested'
}

export function checkReturnEligibility(order: ReturnOrder): EligibilityResult {
  const createdAt = order.created_at || order.createdAt
  if (!createdAt) {
    return {
      eligible: false,
      reason: 'Order date is missing, so return eligibility cannot be confirmed.',
    }
  }

  const status = (order.status || '').toLowerCase()
  if (!['delivered', 'completed'].includes(status)) {
    return {
      eligible: false,
      reason: 'Returns are available after an order has been delivered.',
    }
  }

  const orderDate = new Date(createdAt)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - orderDate.getTime()) / 86400000)
  const daysRemaining = Math.max(0, 30 - daysSince)

  if (Number.isNaN(orderDate.getTime())) {
    return {
      eligible: false,
      reason: 'Order date is invalid, so return eligibility cannot be confirmed.',
    }
  }

  if (daysSince > 30) {
    return {
      eligible: false,
      reason: 'This order is outside the 30-day return window.',
      daysRemaining: 0,
    }
  }

  if (['cancelled', 'refunded'].includes(status)) {
    return {
      eligible: false,
      reason: 'This order has already been cancelled or refunded.',
    }
  }

  const items = order.items || order.OrderItem || []
  const hasCustomItem = items.some((item) => item.is_custom || item.isCustom || Boolean(item.engraving))
  if (hasCustomItem) {
    return {
      eligible: false,
      reason: 'Custom or engraved items cannot be returned.',
    }
  }

  const hasFinalSale = items.some((item) => item.is_final_sale || item.isFinalSale)
  if (hasFinalSale) {
    return {
      eligible: false,
      reason: 'Items marked as final sale cannot be returned.',
    }
  }

  return {
    eligible: true,
    daysRemaining,
  }
}

