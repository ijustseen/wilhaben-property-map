"use client";

import { useEffect, useState } from "react";
import { googleMapsDirectionsUrl, JKU_LINZ } from "@/lib/jku";
import type { TransitJourney } from "@/lib/transit";

type CommuteToJkuProps = {
  lat: number;
  lng: number;
};

export default function CommuteToJku({ lat, lng }: CommuteToJkuProps) {
  const [expanded, setExpanded] = useState(false);
  const [journey, setJourney] = useState<TransitJourney | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setExpanded(false);
    setJourney(null);
    setError(null);
  }, [lat, lng]);

  useEffect(() => {
    if (!expanded) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/transit?lat=${lat}&lng=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        setJourney(data.journey);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load route to JKU",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lng, expanded]);

  const summary = journey
    ? `~${journey.totalMinutes} min total`
    : JKU_LINZ.address;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/60">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900">
            Commute to {JKU_LINZ.name}
          </h2>
          <p className="text-sm text-zinc-600">{summary}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white">
            JKU
          </span>
          <span className="text-sm text-zinc-500">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-blue-200 px-4 pb-4 pt-3">
          {loading && (
            <p className="text-sm text-zinc-500">Planning your route…</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {journey && (
            <>
              <div className="rounded-lg bg-white px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Total travel time
                </p>
                <p className="text-lg font-semibold text-zinc-900">
                  ~{journey.totalMinutes} min
                </p>
              </div>

              <ol className="space-y-2">
                {journey.legs.map((leg, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                      {index + 1}
                    </span>
                    <div>
                      {leg.type === "walk" ? (
                        <p className="text-zinc-800">
                          <span className="font-medium">
                            {leg.durationMinutes} min
                          </span>{" "}
                          walk to {leg.to}
                        </p>
                      ) : (
                        <>
                          <p className="text-zinc-800">
                            <span className="font-medium">
                              {leg.lineLabel}
                            </span>{" "}
                            to {leg.to}
                          </p>
                          <p className="text-xs text-zinc-500">
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
                href={googleMapsDirectionsUrl(lat, lng)}
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
