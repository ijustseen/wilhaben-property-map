import type { MonthlyCostSummary } from "@/lib/monthly-cost";

type MonthlyCostCardProps = {
  summary: MonthlyCostSummary;
};

export default function MonthlyCostCard({ summary }: MonthlyCostCardProps) {
  return (
    <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">
            Total monthly housing cost
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Rent plus utilities and home internet
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          {summary.totalDisplay}
        </p>
      </div>

      <ul className="space-y-2">
        {summary.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-start justify-between gap-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-[var(--ink)]">
                {line.label}
                {line.estimated && (
                  <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">
                    estimated
                  </span>
                )}
              </p>
              {line.note && (
                <p className="text-xs text-[var(--muted)]">{line.note}</p>
              )}
            </div>
            <p className="shrink-0 font-medium text-[var(--ink)]">
              {line.estimated ? "~" : ""}
              {new Intl.NumberFormat("de-AT", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 2,
              }).format(line.amount)}
            </p>
          </li>
        ))}
      </ul>

      {summary.footnote && (
        <p className="mt-3 text-xs text-[var(--muted)]">{summary.footnote}</p>
      )}
    </section>
  );
}
