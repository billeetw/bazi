import { useEffect, type ReactNode } from "react";

export interface ViewerSystemDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * 系統層 UI：示範命書、Beta 生成等非主閱讀流程（由頂欄 ⚙ 開啟）。
 */
export function ViewerSystemDrawer({ open, onClose, title = "系統與示範", children }: ViewerSystemDrawerProps) {
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="lifebook-system-drawer-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="關閉系統選單"
      />
      <div
        id="lifebook-system-panel"
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-slate-700/60 bg-slate-900 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-700/50 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <h2 id="lifebook-system-drawer-title" className="text-sm font-semibold text-slate-200">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            關閉
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
