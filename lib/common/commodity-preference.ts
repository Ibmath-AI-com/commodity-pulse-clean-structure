import { normalizeCommodity } from "@/lib/common/options";

export const LS_COMMODITY = "ai_commodity_selected";
export const DEFAULT_COMMODITY = "sulphur";

export function getStoredCommodity(fallback = DEFAULT_COMMODITY) {
  if (typeof window === "undefined") {
    return normalizeCommodity(fallback);
  }

  return normalizeCommodity(window.localStorage.getItem(LS_COMMODITY) ?? fallback);
}

export function ensureStoredCommodity(fallback = DEFAULT_COMMODITY) {
  const next = getStoredCommodity(fallback);

  if (typeof window !== "undefined" && !window.localStorage.getItem(LS_COMMODITY)) {
    window.localStorage.setItem(LS_COMMODITY, next);
  }

  return next;
}

export function setStoredCommodity(value: string) {
  const next = normalizeCommodity(value || DEFAULT_COMMODITY);

  if (typeof window === "undefined") {
    return next;
  }

  const previous = normalizeCommodity(window.localStorage.getItem(LS_COMMODITY) ?? DEFAULT_COMMODITY);
  window.localStorage.setItem(LS_COMMODITY, next);

  if (previous !== next) {
    window.dispatchEvent(new Event("ai:commodity"));
  }

  return next;
}

export function subscribeStoredCommodity(onChange: (value: string) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const read = () => onChange(getStoredCommodity());

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === LS_COMMODITY) {
      read();
    }
  };

  const onCommodityEvent = () => read();

  window.addEventListener("storage", onStorage);
  window.addEventListener("ai:commodity", onCommodityEvent);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("ai:commodity", onCommodityEvent);
  };
}
