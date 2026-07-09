import type { AppLocale } from "./locale";

const CHUNK_SIZE = 450;

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let rest = text;

  while (rest.length > CHUNK_SIZE) {
    let splitAt = rest.lastIndexOf(" ", CHUNK_SIZE);
    if (splitAt < CHUNK_SIZE / 2) splitAt = CHUNK_SIZE;
    chunks.push(rest.slice(0, splitAt).trim());
    rest = rest.slice(splitAt).trim();
  }

  if (rest) chunks.push(rest);
  return chunks;
}

async function translateChunk(
  text: string,
  source: string,
  target: AppLocale,
): Promise<string> {
  if (!text.trim() || source === target) return text;

  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${source}|${target}`);

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`Translation service returned ${response.status}`);
  }

  const data = (await response.json()) as {
    responseData?: { translatedText?: string };
  };

  return data.responseData?.translatedText ?? text;
}

export async function translateText(
  text: string,
  target: AppLocale,
  source = "de",
): Promise<string> {
  if (!text.trim() || source === target) return text;

  const chunks = chunkText(text);
  const translated: string[] = [];

  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, source, target));
  }

  return translated.join(" ");
}

export async function translateFields<T extends Record<string, string | null>>(
  fields: T,
  target: AppLocale,
  source = "de",
): Promise<T> {
  const entries = await Promise.all(
    Object.entries(fields).map(async ([key, value]) => [
      key,
      value ? await translateText(value, target, source) : null,
    ]),
  );
  return Object.fromEntries(entries) as T;
}
