import Button from "@douyinfe/semi-ui/lib/es/button";
import Empty from "@douyinfe/semi-ui/lib/es/empty";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import type { ReactNode } from "react";

export function ResponsiveListFeedback({
  empty,
  emptyLabel,
  error,
  errorDetail,
  errorLabel,
  loading,
  loadingLabel,
  onRetry,
  primaryAction,
  retryLabel,
  testId,
}: {
  empty: boolean;
  emptyLabel: ReactNode;
  error: boolean;
  errorDetail?: ReactNode;
  errorLabel: ReactNode;
  loading: boolean;
  loadingLabel: string;
  onRetry(): void;
  primaryAction?: ReactNode;
  retryLabel: ReactNode;
  testId: string;
}) {
  if (!loading && !error && !empty) return null;

  if (loading) {
    return <div aria-busy="true" aria-label={loadingLabel} className="responsive-list-feedback" data-state="loading" data-testid={testId} role="status"><Spin /><Typography.Text>{loadingLabel}</Typography.Text></div>;
  }
  if (error) {
    return <div className="responsive-list-feedback" data-state="error" data-testid={testId} role="alert"><Typography.Text type="danger">{errorLabel}</Typography.Text>{errorDetail ? <Typography.Text type="tertiary">{errorDetail}</Typography.Text> : null}<Button onClick={onRetry}>{retryLabel}</Button></div>;
  }
  return <div className="responsive-list-feedback" data-state="empty" data-testid={testId}><Empty description={emptyLabel} image={null}>{primaryAction}</Empty></div>;
}

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
