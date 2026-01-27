const CUSTOM_FLAVOR_PREFIX = "自由入力フレーバー:";
const CUSTOM_FLAVOR_SEPARATOR = " / ";

export type ParsedCustomFlavorEntry = {
  name: string;
  brand: string;
  grams: number | "";
};

export const extractCustomFlavors = (notes?: string | null): string[] => {
  if (!notes) return [];
  const line = notes
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.startsWith(CUSTOM_FLAVOR_PREFIX));
  if (!line) return [];
  const payload = line.replace(CUSTOM_FLAVOR_PREFIX, "").trim();
  if (!payload) return [];
  return payload
    .split(",")
    .map((value) => normalizeCustomFlavorLabel(value.trim()))
    .filter((value) => value.length > 0);
};

export const extractCustomFlavorEntries = (notes?: string | null): string[] => {
  if (!notes) return [];
  const line = notes
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.startsWith(CUSTOM_FLAVOR_PREFIX));
  if (!line) return [];
  const payload = line.replace(CUSTOM_FLAVOR_PREFIX, "").trim();
  if (!payload) return [];
  return payload
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const stripCustomFlavorNotes = (notes?: string | null): string => {
  if (!notes) return "";
  const filtered = notes
    .split("\n")
    .filter((value) => !value.trim().startsWith(CUSTOM_FLAVOR_PREFIX))
    .join("\n")
    .trim();
  return filtered;
};

export const parseCustomFlavorEntry = (value: string): ParsedCustomFlavorEntry => {
  let label = value.trim();
  let grams: number | "" = "";
  const gramsMatch = label.match(/[\(（]\s*(\d+(?:\.\d+)?)\s*g\s*[\)）]\s*$/i);
  if (gramsMatch) {
    grams = Number(gramsMatch[1]);
    label = label.replace(gramsMatch[0], "").trim();
  }
  let { brand, name } = splitCustomFlavorLabel(label);
  return { name, brand, grams };
};

export const formatCustomFlavorEntry = (params: { name: string; brand?: string; grams?: number | "" }): string => {
  const name = params.name.trim();
  const brand = (params.brand ?? "").trim();
  if (!name) return "";
  const gramsValue = typeof params.grams === "number" && params.grams > 0 ? ` (${params.grams}g)` : "";
  const label = brand ? `${brand}${CUSTOM_FLAVOR_SEPARATOR}${name}` : name;
  return `${label}${gramsValue}`;
};

const stripGramsSuffix = (value: string): string => {
  if (!value) return "";
  return value.replace(/\s*[\(（]?\s*\d+(?:\.\d+)?\s*g\s*[\)）]?\s*$/i, "").trim();
};

const splitCustomFlavorLabel = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.includes(CUSTOM_FLAVOR_SEPARATOR)) {
    return { brand: "", name: trimmed };
  }
  const parts = trimmed.split(CUSTOM_FLAVOR_SEPARATOR);
  const brand = parts.shift()?.trim() ?? "";
  const name = parts.join(CUSTOM_FLAVOR_SEPARATOR).trim();
  return { brand, name };
};

const normalizeCustomFlavorLabel = (value: string): string => {
  const cleaned = stripGramsSuffix(value.trim());
  if (!cleaned) return "";
  if (!cleaned.includes(CUSTOM_FLAVOR_SEPARATOR)) return cleaned;
  const { brand, name } = splitCustomFlavorLabel(cleaned);
  return [brand, name].filter(Boolean).join(" ").trim();
};
