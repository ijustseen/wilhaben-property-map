"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { getCity } from "@/lib/cities";
import {
  MAP_ENTRY_PATH,
  searchUniversities,
  UNIVERSITIES,
  universityMapPath,
  type University,
} from "@/lib/universities";

export default function UniversitySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintKind, setHintKind] = useState<"ok" | "error">("ok");

  const matches = useMemo(() => {
    const list = searchUniversities(query).filter(
      (u) => u.status === "available",
    );
    if (!query.trim()) return list.slice(0, 10);
    return list.slice(0, 8);
  }, [query]);

  const liveUnis = UNIVERSITIES.filter((u) => u.status === "available");

  function pick(uni: University) {
    setOpen(false);
    setQuery("");
    setHint(null);
    if (uni.status === "soon") {
      const city = getCity(uni.cityId);
      setHintKind("error");
      setHint(
        `${uni.shortName} in ${city?.name ?? uni.cityId} is not available yet.`,
      );
      return;
    }
    router.push(universityMapPath(uni));
  }

  function go(event?: FormEvent) {
    event?.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push(MAP_ENTRY_PATH);
      return;
    }
    const available = matches.find((uni) => uni.status === "available");
    if (available) {
      pick(available);
      return;
    }
    const soon = matches.find((uni) => uni.status === "soon");
    if (soon) {
      pick(soon);
      return;
    }
    setHintKind("error");
    setHint("No match in Austrian universities. Try JKU, Kunstuni, or Wien.");
  }

  return (
    <form className="landing-search" onSubmit={go}>
      <div className="landing-search-row landing-search-row--suggest">
        <div className="landing-search-field">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHint(null);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search Austrian university or city"
            aria-label="Search university"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
          />
          {open && matches.length > 0 && (
            <ul className="landing-suggest" role="listbox">
              {matches.map((uni) => {
                const city = getCity(uni.cityId);
                return (
                  <li key={uni.id} role="option">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(uni)}
                    >
                      <span className="landing-suggest-main">
                        <strong>{uni.shortName}</strong>
                        <span>{uni.name}</span>
                      </span>
                      <span className="landing-suggest-meta">
                        {city?.name}
                        {uni.status === "soon" ? " · soon" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button type="submit">Search</button>
      </div>
      {hint ? (
        <p
          className={`landing-hint ${hintKind === "error" ? "landing-hint-error" : ""}`}
        >
          {hint}{" "}
          {liveUnis[0] && (
            <Link href={MAP_ENTRY_PATH}>Open housing map</Link>
          )}
        </p>
      ) : (
        <p className="landing-hint">
          Type to see universities across Austria — Vienna, Graz, Linz, Innsbruck
          and more.
        </p>
      )}
    </form>
  );
}
