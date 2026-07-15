export type MonthlyCostLine = {
  id: string;
  label: string;
  amount: number;
  estimated: boolean;
  note?: string;
};

export type MonthlyCostSummary = {
  lines: MonthlyCostLine[];
  total: number;
  totalDisplay: string;
  hasEstimates: boolean;
  footnote: string | null;
};

const DEFAULT_ELECTRICITY = 55;
const DEFAULT_INTERNET = 35;

type CostInput = {
  rent: number | null;
  operating: number | null;
  heating: number | null;
  electricity: number | null;
  internet: number | null;
  text: string;
};

type InclusionFlags = {
  heatingIncluded: boolean;
  operatingIncluded: boolean;
  electricityIncluded: boolean;
  internetIncluded: boolean;
  warmRent: boolean;
  operatingExtra: boolean;
  heatingExtra: boolean;
  electricityExtra: boolean;
};

function parseMoney(value: string | undefined | null): number | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function formatEuro(amount: number, estimated = false): string {
  const formatted = new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
  return estimated ? `~${formatted}` : formatted;
}

function normalizeText(...parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function includesCostInRent(text: string, costKeyword: string): boolean {
  const pattern = new RegExp(
    `${costKeyword}[^.\\n]{0,48}\\binkl(?:udiert)?(?!\\.?\\s*mwst)`,
    "i",
  );
  return pattern.test(text);
}

function isBilledExtra(text: string, costKeyword: string): boolean {
  // VAT notes like "zzgl. 10% USt" must not count as "BK billed separately".
  const cleaned = text.replace(/\b(zzgl|exkl|inkl)\.?\s*\d+\s*%?\s*ust\b/gi, " ");

  const patterns = [
    new RegExp(
      `\\b(zzgl|zuzüglich|exkl|ohne|gesondert|extra|nicht inkl)\\.?\\s*${costKeyword}`,
      "i",
    ),
    new RegExp(
      `${costKeyword}[^.\\n]{0,32}\\b(gesondert|extra|separat|nicht (?:in der )?miete|vom mieter)\\b`,
      "i",
    ),
  ];
  return patterns.some((pattern) => pattern.test(cleaned));
}

function detectInclusions(text: string): InclusionFlags {
  const includes = (patterns: RegExp[]) =>
    patterns.some((pattern) => pattern.test(text));

  const operatingExtra =
    isBilledExtra(text, "betriebskosten") ||
    isBilledExtra(text, "nebenkosten") ||
    isBilledExtra(text, "\\bbk\\b");
  const heatingExtra = isBilledExtra(text, "heiz(?:ung|kosten)?");

  return {
    // Default Austrian assumption: BK/heating are inside the advertised rent.
    heatingIncluded: !heatingExtra,
    operatingIncluded: !operatingExtra,
    electricityIncluded:
      includesCostInRent(text, "strom") ||
      includesCostInRent(text, "elektrizität"),
    internetIncluded:
      includesCostInRent(text, "internet") ||
      includesCostInRent(text, "wlan") ||
      includesCostInRent(text, "wifi"),
    warmRent: includes([/gesamtmietpreis/, /warmmiete/, /bruttomiete/]),
    operatingExtra,
    heatingExtra,
    electricityExtra: includes([
      /strom[^.\n]{0,40}(extra|gesondert|eigen|verbrauch|anzumelden)/,
      /nur der strom/,
    ]),
  };
}

function parseAmountNearKeywords(
  text: string,
  keywords: string[],
): number | null {
  for (const keyword of keywords) {
    const pattern = new RegExp(
      `${keyword}[^\\d€]{0,24}(?:€\\s*)?([\\d][\\d.,]*)`,
      "i",
    );
    const match = text.match(pattern);
    const amount = parseMoney(match?.[1]);
    if (amount !== null) return amount;
  }
  return null;
}

function resolvedOptionalAmount(
  structured: number | null,
  parsed: number | null,
  shouldAdd: boolean,
  defaultValue: number | null,
): { amount: number; estimated: boolean } | null {
  if (!shouldAdd) return null;
  if (structured !== null) return { amount: structured, estimated: false };
  if (parsed !== null) return { amount: parsed, estimated: false };
  if (defaultValue === null) return null;
  return { amount: defaultValue, estimated: true };
}

export function buildMonthlyCostSummary(
  input: CostInput,
): MonthlyCostSummary | null {
  if (input.rent === null) return null;

  const text = normalizeText(input.text);
  const flags = detectInclusions(text);
  const treatAsWarmRent = flags.warmRent || flags.operatingIncluded;
  const lines: MonthlyCostLine[] = [];

  lines.push({
    id: "rent",
    label: treatAsWarmRent ? "Rent (incl. utilities)" : "Listed rent",
    amount: input.rent,
    estimated: false,
  });

  const operatingParsed = parseAmountNearKeywords(text, [
    "betriebskosten",
    "nebenkosten",
    "monatliche kosten",
    "bk",
  ]);
  const heatingParsed = parseAmountNearKeywords(text, [
    "heizkosten",
    "heizung",
    "beheizung",
  ]);
  const electricityParsed = parseAmountNearKeywords(text, [
    "strom",
    "elektrizität",
    "electricity",
  ]);
  const internetParsed = parseAmountNearKeywords(text, [
    "internet",
    "wlan",
    "wifi",
    "liwest",
  ]);

  // Default: BK + heating are already inside the advertised rent.
  // Only add them when the listing explicitly marks them as extra.
  const operating = resolvedOptionalAmount(
    input.operating,
    operatingParsed,
    flags.operatingExtra,
    null,
  );
  const heating = resolvedOptionalAmount(
    input.heating,
    heatingParsed,
    flags.heatingExtra,
    null,
  );

  const electricity = flags.electricityIncluded
    ? null
    : resolvedOptionalAmount(
        input.electricity,
        electricityParsed,
        true,
        DEFAULT_ELECTRICITY,
      );

  const internet = flags.internetIncluded
    ? null
    : resolvedOptionalAmount(
        input.internet,
        internetParsed,
        true,
        DEFAULT_INTERNET,
      );

  if (operating) {
    lines.push({
      id: "operating",
      label: "Operating costs",
      amount: operating.amount,
      estimated: operating.estimated,
      note: "Listed separately from rent",
    });
  }

  if (heating) {
    lines.push({
      id: "heating",
      label: "Heating",
      amount: heating.amount,
      estimated: heating.estimated,
      note: "Listed separately from rent",
    });
  }

  if (electricity) {
    lines.push({
      id: "electricity",
      label: "Electricity",
      amount: electricity.amount,
      estimated: electricity.estimated,
      note: flags.electricityExtra
        ? "Billed separately by provider"
        : "Typical estimate when not included",
    });
  }

  if (internet) {
    lines.push({
      id: "internet",
      label: "Internet / Wi‑Fi",
      amount: internet.amount,
      estimated: internet.estimated,
      note: internet.estimated ? "Typical home internet plan" : undefined,
    });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const hasEstimates = lines.some((line) => line.estimated);

  let footnote: string | null =
    "Listed rent is treated as already including operating costs/heating unless the advert says otherwise. Electricity and home Wi‑Fi are estimated when missing.";
  if (flags.warmRent) {
    footnote =
      "Rent already includes heating, water and operating costs where stated in the listing.";
  }

  return {
    lines,
    total,
    totalDisplay: formatEuro(total, hasEstimates),
    hasEstimates,
    footnote,
  };
}

export function buildMonthlyCostFromAttributes(
  attrs: Record<string, string[]>,
  description: string,
  sections: Array<{ title: string; html: string }>,
): MonthlyCostSummary | null {
  const first = (values: string[] | undefined) => values?.[0];

  const sectionText = sections
    .map((section) => `${section.title}\n${section.html}`)
    .join("\n");

  return buildMonthlyCostSummary({
    rent:
      parseMoney(first(attrs["RENTAL_PRICE/PER_MONTH"])) ??
      parseMoney(first(attrs.PRICE)),
    operating: parseMoney(first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"])),
    heating: parseMoney(first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"])),
    electricity: null,
    internet: null,
    text: [
      description,
      sectionText,
      first(attrs["RENTAL_PRICE/PRICE_DESCRIPTION"]) ?? "",
    ].join("\n"),
  });
}

export function buildMonthlyCostFromListingPrice(
  price: number | null,
  _operating: number | null = null,
  _heating: number | null = null,
  priceDescription = "",
): MonthlyCostSummary | null {
  if (price === null) return null;

  // List-card BK/heating fields are informational; advertised price is the base.
  return buildMonthlyCostSummary({
    rent: price,
    operating: null,
    heating: null,
    electricity: null,
    internet: null,
    text: priceDescription,
  });
}

/** @deprecated Shared flats use the listed all-in price — no estimate. */
export function buildMonthlyCostForSharedRoom(
  price: number | null,
): MonthlyCostSummary | null {
  if (price === null) return null;
  return {
    lines: [
      {
        id: "rent",
        label: "Monthly rent (all-in)",
        amount: price,
        estimated: false,
      },
    ],
    total: price,
    totalDisplay: formatEuro(price, false),
    hasEstimates: false,
    footnote: "Shared-flat and dorm prices are usually all-inclusive.",
  };
}
