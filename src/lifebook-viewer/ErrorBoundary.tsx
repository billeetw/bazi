/**
 * 命書 Viewer 最外層錯誤邊界：內部元件拋錯時顯示友善訊息，避免整片空白。
 */

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class LifebookErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: unknown, info: React.ErrorInfo) {
    console.error("[lifebook-viewer] ErrorBoundary caught:", err, info);
  }

  render() {
    if (this.state.hasError) {
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      return (
        <div
          className="flex items-center justify-center min-h-[200px] w-full text-slate-300 text-sm p-6"
          style={{ background: "#0f172a" }}
        >
          {inIframe
            ? "命書內容載入時發生錯誤，請稍後重試或聯絡管理者。"
            : "命書 Viewer 載入失敗，請重新整理頁面。"}
        </div>
      );
    }
    return this.props.children;
  }
}
