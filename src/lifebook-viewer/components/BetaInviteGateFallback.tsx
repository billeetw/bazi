/**
 * 未驗證邀請碼時取代降生藍圖（root shell），避免「公開殼」與 Beta 內容混淆。
 */

export function BetaInviteGateFallback() {
  const goHome = () => {
    try {
      window.location.assign(new URL("/", window.location.origin).href);
    } catch {
      window.location.assign("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">命書 Beta</p>
        <h1 className="text-xl font-semibold text-slate-50 tracking-wide">需先驗證邀請碼</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          降生藍圖、時間軸與完整閱讀等命書 Beta 僅開放給已驗證使用者。請回主站首頁輸入邀請碼並完成驗證後，再從「開啟命書 Beta」進入。
        </p>
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/15 px-5 py-2.5 text-sm font-medium text-amber-100 hover:bg-amber-500/25 transition-colors"
        >
          返回主站
        </button>
      </div>
    </div>
  );
}
