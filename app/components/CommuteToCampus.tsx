"use client";

import { useEffect, useState } from "react";
import type { TransitJourney } from "@/lib/transit";
import {
  googleMapsDirectionsToUniversity,
  type University,
} from "@/lib/universities";

type CommuteToCampusProps = {
  lat: number;
  lng: number;
  university: University;
};

export default function CommuteToCampus({
  lat,
  lng,
  university,
}: CommuteToCampusProps) {
  const [expanded, setExpanded] = useState(false);
  const [journey, setJourney] = useState<TransitJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setExpanded(false);
    setJourney(null);
    setError(null);
  }, [lat, lng, university.id]);

  useEffect(() => {
    if (!expanded) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `/api/transit?lat=${lat}&lng=${lng}&university=${encodeURIComponent(university.id)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setJourney(data.journey);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : `Could not load route to ${university.shortName}`,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, expanded, university.id, university.shortName]);

  const summary = journey
    ? `~${journey.totalMinutes} min total`
    : university.address;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/30">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Commute to campus
          </h2>
          <p className="truncate text-sm text-[var(--muted)]">
            {university.shortName} · {summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
            {university.shortName}
          </span>
          <span className="text-sm text-[var(--muted)]">
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-blue-200 px-4 pb-4 pt-3 dark:border-blue-900">
          {loading && (
            <p className="text-sm text-[var(--muted)]">Planning your route…</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {journey && (
            <>
              <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  Total travel time
                </p>
                <p className="text-lg font-semibold text-[var(--ink)]">
                  ~{journey.totalMinutes} min
                </p>
                <p className="text-xs text-[var(--muted)]">{university.name}</p>
              </div>

              <ol className="space-y-2">
                {journey.legs.map((leg, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {index + 1}
                    </span>
                    <div>
                      {leg.type === "walk" ? (
                        <p className="text-[var(--ink)]">
                          <span className="font-medium">
                            {leg.durationMinutes} min
                          </span>{" "}
                          walk to {leg.to}
                        </p>
                      ) : (
                        <>
                          <p className="text-[var(--ink)]">
                            <span className="font-medium">
                              {leg.lineLabel}
                            </span>{" "}
                            to {leg.to}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {leg.durationMinutes} min
                            {leg.direction ? ` · ${leg.direction}` : ""}
                          </p>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <a
                href={googleMapsDirectionsToUniversity(university, lat, lng)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Open in Google Maps
              </a>
            </>
          )}
        </div>
      )}
    </section>
  );
}
