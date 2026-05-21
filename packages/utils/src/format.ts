import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(date: Date | string, pattern = 'dd MMM yyyy') {
  return format(new Date(date), pattern)
}

export function formatDateTime(date: Date | string) {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function timeAgo(date: Date | string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export function formatFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export function formatInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase()
}
