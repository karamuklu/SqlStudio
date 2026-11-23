import { Plus, X } from "lucide-react";
import { useStudioStore } from "../../store/studio-store";
import { cn } from "../../lib/cn";

export function QueryTabs() {
  const tabs = useStudioStore((state) => state.queryTabs);
  const activeTab = useStudioStore((state) => state.activeQueryTab);
  const setActiveTab = useStudioStore((state) => state.setActiveQueryTab);
  const addQueryTab = useStudioStore((state) => state.addQueryTab);
  const closeQueryTab = useStudioStore((state) => state.closeQueryTab);

  return (
    <div className="flex h-9 items-end border-b border-border bg-panel pl-2">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "group flex h-8 items-center rounded-t-md border border-transparent text-xs text-muted",
            activeTab === tab.id && "border-border border-b-background bg-background text-foreground",
          )}
        >
          <button type="button" onClick={() => setActiveTab(tab.id)} className="h-full px-3">{tab.title}</button>
          {tab.dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Kaydedilmemiş değişiklik" />}
          <button type="button" onClick={() => closeQueryTab(tab.id)} className="mx-1 rounded p-1 opacity-60 hover:bg-elevated hover:opacity-100" aria-label={`${tab.title} sekmesini kapat`}><X className="h-3 w-3" /></button>
        </div>
      ))}
      <button type="button" onClick={addQueryTab} className="mb-1 ml-1 rounded p-1.5 text-muted hover:bg-elevated hover:text-foreground" aria-label="Yeni sorgu">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
