export interface OffsetPaginationQuery {
  page: number;
  limit: number;
}

export interface SortQuery<T = any> {
  field: keyof T;
  order: 'asc' | 'desc';
}

export interface OffsetPaginationInfo {
  totalPage: number;
  page: number;
  pageSize: number;
  limit: number;
  hasNext: boolean;
}

export interface OffsetPaginatedResult<T> {
  data: T[];
  pageInfo: OffsetPaginationInfo;
}

export class OffsetPaginationUtils {
  static applyFilters<T, F>(
    data: T[],
    filters: F,
    matchedFilter: (item: T, filters: F) => boolean,
  ): T[] {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }
    return data.filter((item) => matchedFilter(item, filters));
  }

  static applySorting<T>(data: T[], sorts: SortQuery<T>[]): T[] {
    if (!Array.isArray(sorts) || sorts.length === 0) {
      return data;
    }

    return [...data].sort((a, b) => {
      for (const { field, order } of sorts) {
        const aValue = a[field];
        const bValue = b[field];

        if (aValue === bValue) continue;

        const comparison = aValue < bValue ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  static applyPagination<T>(
    data: T[],
    pagination: OffsetPaginationQuery,
  ): OffsetPaginatedResult<T> {
    const total = data.length;
    const { page, limit } = pagination;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const items = data.slice(startIndex, endIndex);

    return {
      pageInfo: {
        totalPage: Math.ceil(total / limit),
        page,
        pageSize: items.length,
        limit,
        hasNext: total > page * limit,
      },
      data: items,
    };
  }
}
