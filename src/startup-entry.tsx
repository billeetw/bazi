/**
 * 啟動序列入口：掛載到 #startup-root，並暴露 window.showStartupSequence 供主頁呼叫。
 * 主頁在「啟動人生戰略引擎」點擊後呼叫 showStartupSequence({ branchLabel, personaLine, enableSound, onFinished })，
 * 序列結束後 onFinished 再執行排盤邏輯。
 */
import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { StartupSequence } from "./components/StartupSequence";

const ROOT_ID = "startup-root";

export interface ShowStartupSequenceOptions {
  branchLabel?: string;
  personaLine?: string;
  enableSound?: boolean;
  onFinished: () => void;
}

function App() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ShowStartupSequenceOptions | null>(null);

  const showStartupSequence = useCallback((options: ShowStartupSequenceOptions) => {
    setOpts(options);
    setOpen(true);
  }, []);

  const handleFinished = useCallback(() => {
    setOpen(false);
    opts?.onFinished?.();
    setOpts(null);
  }, [opts]);

  React.useEffect(() => {
    (window as unknown as { showStartupSequence?: (o: ShowStartupSequenceOptions) => void }).showStartupSequence = showStartupSequence;
    return () => {
      delete (window as unknown as { showStartupSequence?: (o: ShowStartupSequenceOptions) => void }).showStartupSequence;
    };
  }, [showStartupSequence]);

  return (
    <StartupSequence
      isOpen={open}
      onFinished={handleFinished}
      branchLabel={opts?.branchLabel ?? ""}
      personaLine={opts?.personaLine ?? ""}
      enableSound={opts?.enableSound ?? true}
    />
  );
}

const el = document.getElementById(ROOT_ID);
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
