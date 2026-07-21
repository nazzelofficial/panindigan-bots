/**
 * types/dtos.ts v0.2.6
 * Data Transfer Objects — typed shapes for cross-layer data passing.
 * These are pure data contracts: no logic, no Discord.js imports.
 */
export function paginate(items, page, pageSize) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);
    return { items: pageItems, currentPage: safePage, totalPages, pageSize, totalItems };
}
//# sourceMappingURL=dtos.js.map