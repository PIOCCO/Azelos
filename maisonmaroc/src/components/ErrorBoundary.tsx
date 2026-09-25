import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import i18n from "../i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("UI error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      const t = i18n.t.bind(i18n);
      return (
        <div className="container-page flex min-h-[50vh] flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="max-w-md text-lg font-semibold text-ink-700">{t("inst.errors.boundary")}</p>
          <Link to="/" className="btn-primary" onClick={() => this.setState({ hasError: false })}>
            {t("common.backHome")}
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
