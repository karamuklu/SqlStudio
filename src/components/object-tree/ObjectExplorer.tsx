import { useMemo, useState } from "react";
import { Boxes, ChevronDown, ChevronRight, Database, Folder, FunctionSquare, LoaderCircle, MonitorCog, RefreshCw, Table2, View } from "lucide-react";
import type { DatabaseObjectKind } from "../../types/connections";
import { useStudioStore } from "../../store/studio-store";

const icons = { table: Table2, view: View, procedure: Boxes, function: FunctionSquare } as const;
const labels: Record<DatabaseObjectKind, string> = { table: "Tablolar", view: "Görünümler", procedure: "Saklı yordamlar", function: "Fonksiyonlar" };

export function ObjectExplorer() {
  const connectionName = useStudioStore((state) => state.activeConnectionName);
  const database = useStudioStore((state) => state.activeDatabase);
  const request = useStudioStore((state) => state.activeConnectionRequest);
  const objects = useStudioStore((state) => state.databaseObjects);
  const loading = useStudioStore((state) => state.explorerLoading);
  const refresh = useStudioStore((state) => state.refreshExplorer);
  const [serverOpen, setServerOpen] = useState(true);
  const [databaseOpen, setDatabaseOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<DatabaseObjectKind>>(new Set(["table", "view", "procedure", "function"]));
  const groups = useMemo(() => (["table", "view", "procedure", "function"] as const).map((kind) => ({ kind, items: objects.filter((item) => item.kind === kind) })), [objects]);
  const toggleGroup = (kind: DatabaseObjectKind) => setOpenGroups((current) => { const next = new Set(current); if (next.has(kind)) next.delete(kind); else next.add(kind); return next; });

  return <aside className="flex min-h-0 flex-col overflow-hidden bg-panel">
    <div className="flex h-9 shrink-0 items-center border-b border-border px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
      Nesne gezgini
      <button type="button" disabled={!request || loading} title="Yenile" onClick={() => void refresh()} className="ml-auto rounded p-1 hover:bg-elevated disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
    </div>
    <div className="min-h-0 flex-1 overflow-auto py-1 text-[12px]">
      {!request ? <button type="button" onClick={() => useStudioStore.getState().openConnectionManager()} className="m-2 rounded border border-border px-3 py-2 text-left text-muted hover:bg-elevated">Bağlantı seçmek için tıklayın</button> : <ul>
        <li>
          <button type="button" onClick={() => setServerOpen((value) => !value)} className="flex h-6 w-full items-center gap-1 bg-elevated px-1 text-left font-semibold">
            {serverOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}<MonitorCog className="h-3.5 w-3.5 text-blue-400" /><span className="truncate">{connectionName}</span>
          </button>
          {serverOpen && <ul>
            <li>
              <button type="button" onClick={() => setDatabaseOpen((value) => !value)} className="flex h-6 w-full items-center gap-1 pl-5 text-left hover:bg-elevated">
                {databaseOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}<Database className="h-3.5 w-3.5 text-blue-400" /><span>{database}</span>{loading && <LoaderCircle className="ml-1 h-3 w-3 animate-spin text-muted" />}
              </button>
              {databaseOpen && <ul>{groups.map(({ kind, items }) => { const Icon = icons[kind]; const open = openGroups.has(kind); return <li key={kind}>
                <button type="button" onClick={() => toggleGroup(kind)} className="flex h-6 w-full items-center gap-1 pl-10 text-left hover:bg-elevated">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}<Folder className="h-3.5 w-3.5 text-blue-400" />{labels[kind]} <span className="text-muted">({items.length})</span></button>
                {open && <ul>{items.map((item) => <li key={`${kind}-${item.schema}-${item.name}`} className="flex h-6 items-center gap-1 pl-[62px] pr-2"><Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span className="truncate" title={`${item.schema}.${item.name}`}>{item.schema}.{item.name}</span></li>)}</ul>}
              </li>; })}</ul>}
            </li>
          </ul>}
        </li>
      </ul>}
    </div>
    <div className="h-3 shrink-0 border-t border-border bg-elevated" />
  </aside>;
}

