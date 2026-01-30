export type Pagination = {
  page: number
  limit: number
  skip: number
}

export function parsePagination(searchParams: URLSearchParams): Pagination {
  const pageRaw = searchParams.get('page')
  const limitRaw = searchParams.get('limit')

  const page = Math.max(1, Number(pageRaw ?? 1) || 1)
  const limit = Math.min(100, Math.max(1, Number(limitRaw ?? 20) || 20))

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}
