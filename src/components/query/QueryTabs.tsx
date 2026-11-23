import { Plus, X } from "lucide-react";
import { useStudioStore } from "../../store/studio-store";
import { cn } from "../../lib/cn";

const tabs = [
  { id: "query-1", label: "Sorgu 1.sql", dirty: true },
  { id: "stock-report", label: "Stok_rapor.sql", dirty: false },
];

export function QueryTabs() {
  const activeTab = useStudioStore((state) => state.activeQueryTab);
  const setActiveTab = useStudioStore((state) => state.setActiveQueryTab);
  const showMessage = useStudioStore((state) => state.showPhaseOneMessage);

  return (
    <div className="flex h-9 items-end border-b border-border bg-panel pl-2">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "group flex h-8 items-center gap-2 rounded-t-md border border-transparent px-3 text-xs text-muted",
            activeTab === tab.id && "border-border border-b-background bg-background text-foreground",
          )}
        >
          {tab.label}
          {tab.dirty ? <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> : <X className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
        </button>
      ))}
      <button type="button" onClick={() => showMessage("Yeni sorgu sekmesi")} className="mb-1 ml-1 rounded p-1.5 text-muted hover:bg-elevated hover:text-foreground" aria-label="Yeni sorgu">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
