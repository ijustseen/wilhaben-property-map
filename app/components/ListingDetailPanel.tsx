"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import { localeLabel } from "@/lib/locale";
import type { ListingDetail } from "@/lib/willhaben";
import CommuteToCampus from "./CommuteToCampus";
import MonthlyCostCard from "./MonthlyCostCard";
import type { University } from "@/lib/universities";

type TranslatedContent = {
  title: string;
  description: string;
  highlights: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; html: string; text: string }>;
  teaser: Array<{ value: string; postfix: string | null }>;
};

type ListingDetailPanelProps = {
  detail: ListingDetail | null;
  loading: boolean;
  error: string | null;
  locale: AppLocale;
  university: University;
  favorited: boolean;
  onToggleFavorite: () => void;
  onClose: () => void;
};

export default function ListingDetailPanel({
  detail,
  loading,
  error,
  locale,
  university,
  favorited,
  onToggleFavorite,
  onClose,
}: ListingDetailPanelProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const [translated, setTranslated] = useState<TranslatedContent | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    setImageIndex(0);
    setTranslated(null);
    setShowTranslation(false);
    setTranslateError(null);
  }, [detail?.id]);

  async function handleTranslate() {
    if (!detail) return;

    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translated) {
      setShowTranslation(true);
      return;
    }

    setTranslating(true);
    setTranslateError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detail, target: locale }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Translation failed");
      }
      setTranslated(data.translated);
      setShowTranslation(true);
    } catch (e) {
      setTranslateError(
        e instanceof Error ? e.message : "Could not translate listing",
      );
    } finally {
      setTranslating(false);
    }
  }

  if (!detail && !loading && !error) return null;

  const title = showTranslation && translated ? translated.title : detail?.title;
  const description =
    showTranslation && translated
      ? translated.description
      : detail?.description;
  const highlights =
    showTranslation && translated ? translated.highlights : detail?.highlights;
  const sections =
    showTranslation && translated ? translated.sections : detail?.sections;
  const teaser =
    showTranslation && translated ? translated.teaser : detail?.teaser;

  const showEstimate =
    detail?.source === "apartments" && Boolean(detail.monthlyCost);
  const isAllIn =
    detail?.source === "shared" || detail?.source === "dorms";

  return (
    <aside className="flex h-full w-full flex-col border-l border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Listing details
          </p>
          {detail && (
            <p className="truncate text-sm text-[var(--ink)]">{detail.address}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {detail && (
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                favorited
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "border-[var(--line)] text-[var(--ink)] hover:bg-[var(--mist)]"
              }`}
              aria-pressed={favorited}
            >
              <Heart
                className="h-3.5 w-3.5"
                strokeWidth={2}
                fill={favorited ? "currentColor" : "none"}
                aria-hidden
              />
              {favorited ? "Saved" : "Save"}
            </button>
          )}
          {detail && (
            <a
              href={detail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              View source
            </a>
          )}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={!detail || translating || locale === "de"}
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--mist)] disabled:cursor-not-allowed disabled:opacity-50"
            title={
              locale === "de"
                ? "Your language is German — original text is already shown"
                : `Translate to ${localeLabel(locale)}`
            }
          >
            {translating
              ? "Translating…"
              : showTranslation
                ? "Show original"
                : `Translate (${localeLabel(locale)})`}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--mist)]"
            aria-label="Close listing panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
            Loading listing…
          </div>
        )}

        {error && (
          <div className="p-6 text-sm text-red-600">{error}</div>
        )}

        {translateError && (
          <div className="mx-4 mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {translateError}
          </div>
        )}

        {detail && !loading && (
          <div className="pb-8">
            {detail.images.length > 0 && (
              <div className="relative bg-[var(--mist)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.images[imageIndex]}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                {detail.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImageIndex(
                          (i) =>
                            (i - 1 + detail.images.length) %
                            detail.images.length,
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--surface)]/90 px-3 py-2 text-sm shadow"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImageIndex((i) => (i + 1) % detail.images.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--surface)]/90 px-3 py-2 text-sm shadow"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {detail.images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setImageIndex(index)}
                          className={`h-2 w-2 rounded-full ${
                            index === imageIndex
                              ? "bg-white"
                              : "bg-white/50"
                          }`}
                          aria-label={`Image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-5 px-5 pt-5">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-[var(--ink)]">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">{detail.address}</p>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted)]">
                    {isAllIn ? "Monthly rent (all-in)" : "Listed price"}
                  </p>
                  <p className="text-3xl font-bold text-[var(--ink)]">
                    {detail.priceDisplay}
                  </p>
                  {showEstimate && detail.monthlyCost ? (
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Est. total {detail.monthlyCost.totalDisplay}
                      {detail.pricePerSqm ? ` · ${detail.pricePerSqm}` : ""}
                    </p>
                  ) : isAllIn ? (
                    <p className="text-sm text-[var(--muted)]">
                      Usually includes utilities, electricity &amp; Wi‑Fi
                      {detail.pricePerSqm ? ` · ${detail.pricePerSqm}` : ""}
                    </p>
                  ) : (
                    detail.pricePerSqm && (
                      <p className="text-sm text-[var(--muted)]">
                        {detail.pricePerSqm}
                      </p>
                    )
                  )}
                </div>
                {teaser && teaser.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {teaser.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-md bg-[var(--mist)] px-3 py-1.5 text-sm font-medium text-[var(--ink)]"
                      >
                        {item.value}
                        {item.postfix ? ` ${item.postfix}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showEstimate && detail.monthlyCost && (
                <MonthlyCostCard summary={detail.monthlyCost} />
              )}

              {highlights && highlights.length > 0 && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--line)] p-4">
                  {highlights.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <CommuteToCampus
                lat={detail.lat}
                lng={detail.lng}
                university={university}
              />

              {description && (
                <section>
                  <h2 className="mb-2 text-lg font-semibold text-[var(--ink)]">
                    Description
                  </h2>
                  <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]/85">
                    {description}
                  </div>
                </section>
              )}

              {sections && sections.length > 0 && (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <section key={section.title}>
                      <h2 className="mb-2 text-lg font-semibold text-[var(--ink)]">
                        {section.title}
                      </h2>
                      {showTranslation && "text" in section ? (
                        <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--ink)]/85">
                          {(section as { text: string }).text}
                        </p>
                      ) : (
                        <div
                          className="listing-html text-sm leading-relaxed text-[var(--ink)]/85"
                          dangerouslySetInnerHTML={{ __html: section.html }}
                        />
                      )}
                    </section>
                  ))}
                </div>
              )}

              {(detail.energy.hwb || detail.energy.fgee) && (
                <section className="rounded-xl border border-[var(--line)] p-4">
                  <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">
                    Energy certificate
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detail.energy.hwb && (
                      <div>
                        <p className="text-[var(--muted)]">HWB</p>
                        <p className="font-medium text-[var(--ink)]">
                          {detail.energy.hwb} kWh/m²a
                          {detail.energy.hwbClass
                            ? ` (${detail.energy.hwbClass})`
                            : ""}
                        </p>
                      </div>
                    )}
                    {detail.energy.fgee && (
                      <div>
                        <p className="text-[var(--muted)]">fGEE</p>
                        <p className="font-medium text-[var(--ink)]">
                          {detail.energy.fgee}
                          {detail.energy.fgeeClass
                            ? ` (${detail.energy.fgeeClass})`
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-[var(--line)] p-4">
                <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">
                  Contact
                </h2>
                <div className="flex gap-4">
                  {detail.organisation.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={detail.organisation.logoUrl}
                      alt=""
                      className="h-14 w-14 rounded-lg border border-[var(--line)] object-contain p-1"
                    />
                  )}
                  <div className="space-y-1 text-sm text-[var(--ink)]/85">
                    {(detail.contact.company || detail.organisation.name) && (
                      <p className="font-semibold text-[var(--ink)]">
                        {detail.contact.company ?? detail.organisation.name}
                      </p>
                    )}
                    {detail.contact.name && <p>{detail.contact.name}</p>}
                    {detail.contact.phone && (
                      <p>
                        <a
                          href={`tel:${detail.contact.phone}`}
                          className="text-[var(--link)] hover:underline"
                        >
                          {detail.contact.phone}
                        </a>
                      </p>
                    )}
                    {(detail.contact.email || detail.organisation.email) && (
                      <p>
                        <a
                          href={`mailto:${detail.contact.email ?? detail.organisation.email}`}
                          className="text-[var(--link)] hover:underline"
                        >
                          {detail.contact.email ?? detail.organisation.email}
                        </a>
                      </p>
                    )}
                    {detail.contact.website && (
                      <p>
                        <a
                          href={
                            detail.contact.website.startsWith("http")
                              ? detail.contact.website
                              : `https://${detail.contact.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--link)] hover:underline"
                        >
                          {detail.contact.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
