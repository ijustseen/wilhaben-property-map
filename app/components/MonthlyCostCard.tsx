import type { MonthlyCostSummary } from "@/lib/monthly-cost";

type MonthlyCostCardProps = {
  summary: MonthlyCostSummary;
};

export default function MonthlyCostCard({ summary }: MonthlyCostCardProps) {
  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Total monthly housing cost
          </h2>
          <p className="text-sm text-zinc-600">
            Rent plus utilities and home internet
          </p>
        </div>
        <p className="text-2xl font-bold text-emerald-700">
          {summary.totalDisplay}
        </p>
      </div>

      <ul className="space-y-2">
        {summary.lines.map((line) => (
          <li
            key={line.id}
            className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-zinc-900">
                {line.label}
                {line.estimated && (
                  <span className="ml-2 text-xs font-normal text-amber-700">
                    estimated
                  </span>
                )}
              </p>
              {line.note && (
                <p className="text-xs text-zinc-500">{line.note}</p>
              )}
            </div>
            <p className="shrink-0 font-medium text-zinc-900">
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
        <p className="mt-3 text-xs text-zinc-500">{summary.footnote}</p>
      )}
    </section>
  );
}
