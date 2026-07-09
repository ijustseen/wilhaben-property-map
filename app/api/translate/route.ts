import { NextRequest, NextResponse } from "next/server";
import { isAppLocale } from "@/lib/locale";
import { translateText } from "@/lib/translate";
import type { ListingDetail } from "@/lib/willhaben";

type TranslatePayload = {
  detail: ListingDetail;
  target: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslatePayload;
    const { detail, target } = body;

    if (!detail || !target || !isAppLocale(target)) {
      return NextResponse.json(
        { error: "Invalid translation request" },
        { status: 400 },
      );
    }

    const translatedTitle = await translateText(detail.title, target);
    const translatedDescription = await translateText(detail.description, target);

    const translatedHighlights = await Promise.all(
      detail.highlights.map(async (item) => ({
        label: await translateText(item.label, target, "en"),
        value: await translateText(item.value, target),
      })),
    );

    const translatedSections = await Promise.all(
      detail.sections.map(async (section) => ({
        title: await translateText(section.title, target),
        html: section.html,
        text: await translateText(
          section.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          target,
        ),
      })),
    );

    const translatedTeaser = await Promise.all(
      detail.teaser.map(async (item) => ({
        value: item.value,
        postfix: item.postfix
          ? await translateText(item.postfix, target)
          : null,
      })),
    );

    return NextResponse.json({
      translated: {
        title: translatedTitle,
        description: translatedDescription,
        highlights: translatedHighlights,
        sections: translatedSections,
        teaser: translatedTeaser,
      },
      target,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
