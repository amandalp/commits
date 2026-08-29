/**
 * Small, non-secret view preferences the server needs to know before it
 * renders — so they live in cookies rather than localStorage, the same way the
 * handwritten/clean theme does. Nothing here is worth a database row.
 *
 * Client-safe on purpose: the writer is a client component and the readers are
 * server pages, so this module holds only the name, the type and the parse.
 */

/** Which kinds of open commitment the list is narrowed to. */
export type OpenFilter = "all" | "big" | "everyday";

export const OPEN_FILTER_COOKIE = "commits_open_filter";

export function parseOpenFilter(value: string | undefined): OpenFilter {
  return value === "big" || value === "everyday" ? value : "all";
}
