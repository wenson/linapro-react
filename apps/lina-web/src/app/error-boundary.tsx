import { IconRefresh } from "@douyinfe/semi-icons";
import Button from "@douyinfe/semi-ui/lib/es/button";
import Typography from "@douyinfe/semi-ui/lib/es/typography";
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { runtimeI18n } from "#/runtime/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("React workbench render failed", error, info.componentStack);
  }

  private reloadApplication = (): void => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const title = runtimeI18n.t("app.error.title");
    const description = runtimeI18n.t("app.error.description");
    const reloadLabel = runtimeI18n.t("app.error.reload");

    return (
      <main className="error-page" aria-labelledby="error-title">
        <section className="error-card" role="alert">
          <Typography.Title id="error-title" heading={2}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="tertiary">{description}</Typography.Paragraph>
          <Button
            aria-label={reloadLabel}
            icon={<IconRefresh aria-hidden="true" />}
            theme="solid"
            onClick={this.reloadApplication}
          >
            {reloadLabel}
          </Button>
        </section>
      </main>
    );
  }
}
