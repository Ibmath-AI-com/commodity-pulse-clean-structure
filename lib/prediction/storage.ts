// src/lib/prediction/storage.ts

export const LS_COMMODITY = "ai_commodity_selected";
export const LS_BASIS = "ai_basis_selected";        // stores ordered basis (ACTIVE is index 0)
export const LS_BASE_PRICE = "ai_base_price_selected";

export const STORAGE_PREFIX = "prediction:lastResult:v2:";

/**
 * Stable key for caching by the SET of bases (order-insensitive).
 * Use this when results are equivalent regardless of which basis is ACTIVE.
 */
export function makeStorageKey(commodity: string, basisArr: string[]) {
  const basisKey = (basisArr ?? []).slice().sort().join("|").toLowerCase();
  return `${STORAGE_PREFIX}${commodity.toLowerCase()}::${basisKey}`;
}

/**
 * Order-sensitive key (ACTIVE basis matters).
 * Use this only if you intentionally want separate caches per ACTIVE basis ordering.
 */
export function makeOrderedStorageKey(commodity: string, basisArr: string[]) {
  const basisKey = (basisArr ?? []).slice().join("|").toLowerCase();
  return `${STORAGE_PREFIX}${commodity.toLowerCase()}::ordered::${basisKey}`;
}

export function clearPredictionStorage() {
  if (typeof window === "undefined") return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;

      if (k.startsWith(STORAGE_PREFIX) || k.startsWith("print:")) {
        keysToRemove.push(k);
      }
    }

    for (const k of keysToRemove) window.localStorage.removeItem(k);

    // Intentionally preserve LS_COMMODITY (user preference).
    window.localStorage.removeItem(LS_BASIS);
    window.localStorage.removeItem(LS_BASE_PRICE);
  } catch {
    // ignore
  }
}
