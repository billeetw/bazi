# Lifebook Home Boundary

## Single source of truth

- React Viewer path (`src/lifebook-viewer/**`) is the current production implementation.
- `lifebook-decision-tree-demo.html` is an inspiration archive only.

## Hard rules

- Do not reuse archive CSS class names in React implementation.
- Do not port archive modal patterns (no dual modal flow).
- Home shell must be summary-driven and presentation-only.

## Home shell input contract

`LifebookHomeShell` accepts:

- `summary`
- `onNodeAction`
- `onRequestRevelation`
- optional `onTrackEvent`（gtag／分析；事件名見 `components/home/types.ts` → `HomeEventName`）

It must not read `chart_json`, section raw content, or infer business logic. Summary 仍須由外層組裝（如 `buildHomeSummaryFromDocument`）。

## Home / Viewer interaction events

- **首頁**：`home_core_viewed`、`home_time_node_clicked`、`home_revelation_*`、`home_palace_matrix_cell_clicked`、`timeline_node_clicked` 等。
- **完整閱讀**：`viewer_route_resolved`、`viewer_gate_resolved`、`viewer_scroll_success`、`viewer_access_blocked`（僅 locked 章）。

**Gate 行為（teaser vs locked）** 的單一說明來源：  
[lifebook-viewer-routing-telemetry-and-gate.md](./lifebook-viewer-routing-telemetry-and-gate.md)

