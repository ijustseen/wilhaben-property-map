import { BRAND_NAME } from "./brand";

export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://studiwohnkarte.intruct.com";
}

export function legalOperatorName(): string {
  return process.env.LEGAL_OPERATOR_NAME?.trim() || "intruct.com";
}

export function legalOperatorAddress(): string {
  return (
    process.env.LEGAL_OPERATOR_ADDRESS?.trim() ||
    "Austria — full postal address available on request"
  );
}

export function legalContactEmail(): string {
  return process.env.LEGAL_CONTACT_EMAIL?.trim() || "ijusseen@gmail.com";
}

export const LEGAL_LAST_UPDATED = "15 July 2026";

export function legalPageTitle(kind: "impressum" | "privacy"): string {
  if (kind === "impressum") {
    return `Legal Notice (Impressum) — ${BRAND_NAME}`;
  }
  return `Privacy Policy (Datenschutz) — ${BRAND_NAME}`;
}
