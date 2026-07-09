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

const DEFAULT_OPERATING = 85;
const DEFAULT_HEATING = 75;
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

function detectInclusions(text: string): InclusionFlags {
  const includes = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

  return {
    heatingIncluded:
      includesCostInRent(text, "heiz(?:ung|kosten)?") ||
      includes([
        /heizung,\s*warmwasser/,
      ]),
    operatingIncluded:
      includesCostInRent(text, "betriebskosten") ||
      includesCostInRent(text, "nebenkosten") ||
      includes([
        /\bbk\b[^.\n]{0,20}\binkl(?!\.?\s*mwst)/,
        /sämtliche betriebskosten inkl/,
      ]),
    electricityIncluded:
      includesCostInRent(text, "strom") ||
      includesCostInRent(text, "elektrizität"),
    internetIncluded:
      includesCostInRent(text, "internet") ||
      includesCostInRent(text, "wlan") ||
      includesCostInRent(text, "wifi"),
    warmRent: includes([
      /gesamtmietpreis/,
      /warmmiete/,
      /bruttomiete/,
    ]),
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

function resolvedAmount(
  structured: number | null,
  parsed: number | null,
  included: boolean,
  defaultValue: number,
): { amount: number; estimated: boolean } | null {
  if (included) return null;
  if (structured !== null) return { amount: structured, estimated: false };
  if (parsed !== null) return { amount: parsed, estimated: false };
  return { amount: defaultValue, estimated: true };
}

export function buildMonthlyCostSummary(input: CostInput): MonthlyCostSummary | null {
  if (input.rent === null) return null;

  const text = normalizeText(input.text);
  const flags = detectInclusions(text);
  const treatAsWarmRent = flags.warmRent;
  const lines: MonthlyCostLine[] = [];

  lines.push({
    id: "rent",
    label: treatAsWarmRent ? "Rent (incl. utilities)" : "Base rent",
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

  const operating = treatAsWarmRent
    ? null
    : resolvedAmount(
        input.operating,
        operatingParsed,
        flags.operatingIncluded,
        DEFAULT_OPERATING,
      );
  const heating = treatAsWarmRent
    ? null
    : resolvedAmount(
        input.heating,
        heatingParsed,
        flags.heatingIncluded,
        DEFAULT_HEATING,
      );

  const electricity = flags.electricityIncluded
    ? null
    : resolvedAmount(
        input.electricity,
        electricityParsed,
        false,
        DEFAULT_ELECTRICITY,
      );

  const internet = flags.internetIncluded
    ? null
    : resolvedAmount(input.internet, internetParsed, false, DEFAULT_INTERNET);

  if (operating) {
    lines.push({
      id: "operating",
      label: "Operating costs",
      amount: operating.amount,
      estimated: operating.estimated,
      note: operating.estimated ? "Typical estimate for water, waste, building services" : undefined,
    });
  }

  if (heating) {
    lines.push({
      id: "heating",
      label: "Heating",
      amount: heating.amount,
      estimated: heating.estimated,
    });
  }

  if (electricity) {
    lines.push({
      id: "electricity",
      label: "Electricity",
      amount: electricity.amount,
      estimated: electricity.estimated,
      note: flags.electricityExtra ? "Billed separately by provider" : undefined,
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

  let footnote: string | null = null;
  if (treatAsWarmRent) {
    footnote = "Rent already includes heating, water and operating costs where stated in the listing.";
  } else if (hasEstimates) {
    footnote =
      "Some costs are estimated when the listing does not provide exact amounts.";
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

  const sectionText = sections.map((section) => `${section.title}\n${section.html}`).join("\n");

  return buildMonthlyCostSummary({
    rent:
      parseMoney(first(attrs["RENTAL_PRICE/PER_MONTH"])) ??
      parseMoney(first(attrs.PRICE)),
    operating: parseMoney(first(attrs["RENTAL_PRICE/ADDITIONAL_COST_GROSS"])),
    heating: parseMoney(first(attrs["RENTAL_PRICE/HEATINGCOSTSGROSS"])),
    electricity: null,
    internet: null,
    text: [description, sectionText, first(attrs["RENTAL_PRICE/PRICE_DESCRIPTION"]) ?? ""].join("\n"),
  });
}

export function buildMonthlyCostFromListingPrice(
  price: number | null,
  operating: number | null = null,
  heating: number | null = null,
  priceDescription = "",
): MonthlyCostSummary | null {
  if (price === null) return null;

  return buildMonthlyCostSummary({
    rent: price,
    operating,
    heating,
    electricity: null,
    internet: null,
    text: priceDescription,
  });
}
