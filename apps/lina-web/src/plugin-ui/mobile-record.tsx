import type { ReactNode } from "react";

export function MobileRecordList({ children, testId }: { children: ReactNode; testId: string }) {
  return <div className="mobile-record-list" data-testid={testId}>{children}</div>;
}

export function MobileRecordCard({ children, testId }: { children: ReactNode; testId?: string }) {
  return <article className="mobile-record-card" data-testid={testId}>{children}</article>;
}

export function MobileRecordTitle({ children }: { children: ReactNode }) {
  return <h4 className="mobile-record-title">{children}</h4>;
}

export function MobileRecordField({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className="mobile-record-field"><dt>{label}</dt><dd>{value}</dd></div>;
}

export function MobileRecordFields({ children }: { children: ReactNode }) {
  return <dl className="mobile-record-fields">{children}</dl>;
}

export function MobileRecordActions({ children }: { children: ReactNode }) {
  return <div className="mobile-record-actions">{children}</div>;
}
