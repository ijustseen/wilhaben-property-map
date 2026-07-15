import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

type LegalDocumentProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export default function LegalDocument({
  title,
  subtitle,
  children,
}: LegalDocumentProps) {
  return (
    <article className="legal-page">
      <div className="landing-wrap legal-page-inner">
        <p className="landing-kicker">Legal</p>
        <h1 className="landing-headline landing-headline--sm">{title}</h1>
        {subtitle && <p className="legal-lead">{subtitle}</p>}
        <p className="legal-updated">Last updated: {LEGAL_LAST_UPDATED}</p>
        <div className="legal-body">{children}</div>
        <p className="legal-back">
          <Link href="/">← Back to {BRAND_NAME}</Link>
        </p>
      </div>
    </article>
  );
}
