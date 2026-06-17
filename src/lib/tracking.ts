export type CarrierValue = 'fedex' | 'ups' | 'usps' | 'dhl' | 'other'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export const CARRIERS: Array<{ value: CarrierValue; label: string }> = [
  { value: 'fedex', label: 'FedEx' },
  { value: 'ups', label: 'UPS' },
  { value: 'usps', label: 'USPS' },
  { value: 'dhl', label: 'DHL' },
  { value: 'other', label: 'Other' },
]

export const ORDER_STATUSES: Array<{
  value: OrderStatus
  label: string
  color: string
  background: string
  description: string
}> = [
  {
    value: 'pending',
    label: 'Pending',
    color: '#B8A090',
    background: '#FDF8F2',
    description: 'Order received',
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    color: '#8A6A24',
    background: '#EDD9AF',
    description: 'Order confirmed',
  },
  {
    value: 'processing',
    label: 'Processing',
    color: '#6B2D44',
    background: '#E8C4D0',
    description: 'Being prepared',
  },
  {
    value: 'shipped',
    label: 'Shipped',
    color: '#3F5D34',
    background: '#DDE8D6',
    description: 'On the way',
  },
  {
    value: 'delivered',
    label: 'Delivered',
    color: '#3F5D34',
    background: '#DDE8D6',
    description: 'Delivered',
  },
  {
    value: 'completed',
    label: 'Completed',
    color: '#3F5D34',
    background: '#DDE8D6',
    description: 'Completed',
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    color: '#A85C6A',
    background: '#FCF0F4',
    description: 'Cancelled',
  },
  {
    value: 'refunded',
    label: 'Refunded',
    color: '#A85C6A',
    background: '#FCF0F4',
    description: 'Refunded',
  },
]

export function getCarrierLabel(carrier?: string | null): string {
  return CARRIERS.find((item) => item.value === carrier)?.label || 'Other'
}

export function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const encodedTrackingNumber = encodeURIComponent(trackingNumber.trim())
  if (!encodedTrackingNumber) return '#'

  const urls: Record<string, string> = {
    fedex: `https://www.fedex.com/fedextrack/?trknbr=${encodedTrackingNumber}`,
    ups: `https://www.ups.com/track?tracknum=${encodedTrackingNumber}`,
    usps: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedTrackingNumber}`,
    dhl: `https://www.dhl.com/en/express/tracking.html?AWB=${encodedTrackingNumber}`,
    other: '#',
  }

  return urls[carrier] || '#'
}

export function normalizeOrderStatus(status?: string | null): OrderStatus {
  if (status === 'received') return 'confirmed'
  if (status === 'in_production') return 'processing'

  if (ORDER_STATUSES.some((item) => item.value === status)) {
    return status as OrderStatus
  }

  return 'pending'
}

export function orderStatusLabel(status?: string | null): string {
  const normalized = normalizeOrderStatus(status)
  return ORDER_STATUSES.find((item) => item.value === normalized)?.label || 'Pending'
}

export function orderStatusStyle(status?: string | null) {
  const normalized = normalizeOrderStatus(status)
  const match = ORDER_STATUSES.find((item) => item.value === normalized)
  return {
    background: match?.background || '#FDF8F2',
    color: match?.color || '#B8A090',
  }
}
