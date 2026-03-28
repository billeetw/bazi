/**
 * 命書 Viewer 最外層錯誤邊界：內部元件拋錯時顯示友善訊息，避免整片空白。
 * 開發模式（Vite）會顯示錯誤訊息與 stack，便於除錯。
 */

import React from "react";

const IS_DEV = import.meta.env.DEV;

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LifebookErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(err: unknown): State {
    const e = err instanceof Error ? err : new Error(String(err));
    return { hasError: true, error: e };
  }

  componentDidCatch(err: unknown, info: React.ErrorInfo) {
    console.error("[lifebook-viewer] ErrorBoundary caught:", err, info);
  }

  render() {
    if (this.state.hasError) {
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      const msg = this.state.error;
      return (
        <div
          className="flex flex-col items-center justify-center min-h-[200px] w-full text-slate-300 text-sm p-6 max-w-3xl mx-auto"
          style={{ background: "#0f172a" }}
        >
          <p className="text-center">
            {inIframe
              ? "命書內容載入時發生錯誤，請稍後重試或聯絡管理者。"
              : "命書 Viewer 載入失敗，請重新整理頁面。"}
          </p>
          {IS_DEV && msg ? (
            <details className="mt-4 w-full text-left text-xs text-red-300/95 font-mono">
              <summary className="cursor-pointer text-amber-400/90 mb-2">開發用錯誤詳情（點開）</summary>
              <pre className="overflow-auto max-h-64 p-3 rounded-lg bg-black/40 border border-red-500/30 whitespace-pre-wrap break-words">
                {msg.message}
                {msg.stack ? `\n\n${msg.stack}` : ""}
              </pre>
            </details>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
