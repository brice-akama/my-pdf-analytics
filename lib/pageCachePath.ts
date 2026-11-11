// lib/pageCachePath.ts
//
// Single source of truth for where a cached single-page PDF lives in Cloudinary.
// Used by BOTH the background page preparation (lib/preExtractPages.ts) and the
// viewer route (app/api/view/[token]/page/route.ts) so they can never disagree.
//
// Version 1 keeps the ORIGINAL path, so every page already cached before this
// change keeps working with no migration.
// Version 2 and above get their own folder, so a new version of a document can
// never be served the old version's pages.

export function pageCachePublicId(
  documentId: string,
  version: number | null | undefined,
  pageNum: number
): string {
  const v = version && version > 1 ? version : 1
  return v === 1
    ? `docmetrics/pages/${documentId}/page_${pageNum}`
    : `docmetrics/pages/${documentId}/v${v}/page_${pageNum}`
}