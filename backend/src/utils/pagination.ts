export type PaginationQuery = {
  page?: unknown;
  limit?: unknown;
};

export function getPagination(query: PaginationQuery, total: number, maxLimit = 60) {
  const requestedPage = Number(query.page ?? 1);
  const requestedLimit = Number(query.limit ?? 24);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), maxLimit) : 24;
  const pages = Math.max(1, Math.ceil(Math.max(total, 0) / limit));
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(Math.floor(requestedPage), 1), pages) : 1;

  return { page, limit, pages, skip: (page - 1) * limit };
}
