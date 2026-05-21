export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export type SortOrder = 'asc' | 'desc'
