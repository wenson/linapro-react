import Button from "@douyinfe/semi-ui/lib/es/button";
import Empty from "@douyinfe/semi-ui/lib/es/empty";
import Spin from "@douyinfe/semi-ui/lib/es/spin";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import type { ReactNode } from "react";

import type { Translate } from "./ai-data";

export function ListFeedback({
  empty,
  error,
  loading,
  onRetry,
  primaryAction,
  t,
}: {
  empty: boolean;
  error?: string;
  loading: boolean;
  onRetry(): void;
  primaryAction?: ReactNode;
  t: Translate;
}) {
  if (loading) {
    return <div aria-busy="true" className="ai-core-list-feedback" data-testid="ai-list-loading" role="status"><Spin aria-label={t("pages.common.loading")} /><Typography.Text>{t("pages.common.loading")}</Typography.Text></div>;
  }
  if (error) {
    return <div className="ai-core-list-feedback" data-testid="ai-list-failed" role="alert"><Typography.Text type="danger">{t("pages.common.loadFailed")}</Typography.Text><Typography.Text type="tertiary">{error}</Typography.Text><Button onClick={onRetry}>{t("fallback.retry")}</Button></div>;
  }
  if (empty) {
    return <Empty className="ai-core-list-feedback" description={t("pages.common.emptyList")} image={null}>{primaryAction}</Empty>;
  }
  return null;
}
