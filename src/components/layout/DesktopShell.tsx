import { useRef } from "react";
import { ObjectExplorer } from "../object-tree/ObjectExplorer";
import { QueryEditor } from "../query/QueryEditor";
import { QueryTabs } from "../query/QueryTabs";
import { ResultsPanel } from "../results/ResultsPanel";
import { useStudioStore } from "../../store/studio-store";
import { StatusBar } from "./StatusBar";
import { Toolbar } from "./Toolbar";

export function DesktopShell() {
  const shellRef = useRef<HTMLDivElement>(null);
  const explorerWidth = useStudioStore((state) => state.explorerWidth);
  const resultsHeight = useStudioStore((state) => state.resultsHeight);
  const setExplorerWidth = useStudioStore((state) => state.setExplorerWidth);
  const setResultsHeight = useStudioStore((state) => state.setResultsHeight);

  const startHorizontalResize = (event: React.PointerEvent) => {
    const handle = event.currentTarget;
    document.body.classList.add("is-resizing");
    const startX = event.clientX;
    const startWidth = explorerWidth;
    const onMove = (moveEvent: PointerEvent) => setExplorerWidth(startWidth + moveEvent.clientX - startX);
    const onStop = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onStop);
    };
    handle.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onStop, { once: true });
  };

  const startVerticalResize = (event: React.PointerEvent) => {
    const handle = event.currentTarget;
    document.body.classList.add("is-resizing");
    const startY = event.clientY;
    const startHeight = resultsHeight;
    const onMove = (moveEvent: PointerEvent) => setResultsHeight(startHeight + startY - moveEvent.clientY);
    const onStop = () => {
      document.body.classList.remove("is-resizing");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onStop);
    };
    handle.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onStop, { once: true });
  };

  return (
    <div ref={shellRef} className="grid h-screen min-h-[620px] min-w-[860px] grid-rows-[42px_minmax(0,1fr)_22px] overflow-hidden bg-background text-foreground">
      <Toolbar />
      <div className="grid min-h-0" style={{ gridTemplateColumns: `${explorerWidth}px 4px minmax(0, 1fr)` }}>
        <ObjectExplorer />
        <div role="separator" aria-orientation="vertical" aria-label="Nesne gezgini genişliği" className="resize-handle resize-handle-x" onPointerDown={startHorizontalResize} />
        <main className="grid min-h-0 grid-rows-[36px_minmax(0,1fr)]">
          <QueryTabs />
          <div className="grid min-h-0" style={{ gridTemplateRows: `minmax(180px, 1fr) 5px ${resultsHeight}px` }}>
            <QueryEditor />
            <div role="separator" aria-orientation="horizontal" aria-label="Sonuç paneli yüksekliği" className="resize-handle resize-handle-y" onPointerDown={startVerticalResize} />
            <ResultsPanel />
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
