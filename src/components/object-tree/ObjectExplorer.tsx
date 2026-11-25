import { useEffect, useState, type ComponentType } from "react";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Columns3,
  Database,
  Folder,
  FunctionSquare,
  KeyRound,
  List,
  LoaderCircle,
  MonitorCog,
  RefreshCw,
  Table2,
  View,
  Zap,
} from "lucide-react";
import { objectChildrenKey, useStudioStore } from "../../store/studio-store";
import type { DatabaseObject, DatabaseObjectKind } from "../../types/connections";
import { cn } from "../../lib/cn";

type Icon = ComponentType<{ className?: string }>;

const rootGroups: Array<{ kind: DatabaseObjectKind; label: string; icon: Icon }> = [
  { kind: "table", label: "Tables", icon: Table2 },
  { kind: "view", label: "Views", icon: View },
  { kind: "procedure", label: "Stored Procedures", icon: Boxes },
  { kind: "function", label: "Functions", icon: FunctionSquare },
];

const tableGroups: Array<{ kind: DatabaseObjectKind; label: string; icon: Icon }> = [
  { kind: "column", label: "Columns", icon: Columns3 },
  { kind: "key", label: "Keys", icon: KeyRound },
  { kind: "index", label: "Indexes", icon: List },
  { kind: "trigger", label: "Triggers", icon: Zap },
];

function Caret({ open }: { open: boolean }) {
  return open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />;
}

function ObjectLeaf({ item, depth, icon: ItemIcon }: { item: DatabaseObject; depth: number; icon: Icon }) {
  const displayName = item.parentName ? item.name : `${item.schema}.${item.name}`;
  return <li className="flex h-6 min-w-max items-center gap-1 pr-2" style={{ paddingLeft: depth * 18 + 4 }} title={item.detail ? `${item.schema}.${item.name} — ${item.detail}` : `${item.schema}.${item.name}`}>
    <span className="w-3.5 shrink-0" /><ItemIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
    <span className="truncate">{displayName}</span>{item.detail && <span className="ml-1 text-[10px] text-muted">{item.detail}</span>}
  </li>;
}

function DetailGroup({ label, icon: GroupIcon, items, depth }: { label: string; icon: Icon; items: DatabaseObject[]; depth: number }) {
  const [open, setOpen] = useState(false);
  return <li>
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-6 min-w-max w-full items-center gap-1 pr-2 text-left hover:bg-elevated" style={{ paddingLeft: depth * 18 + 4 }}>
      <Caret open={open} /><GroupIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{label}</span><span className="text-muted">({items.length})</span>
    </button>
    {open && <ul>{items.map((item) => <ObjectLeaf key={`${item.kind}-${item.schema}-${item.parentName}-${item.name}`} item={item} depth={depth + 1} icon={GroupIcon} />)}</ul>}
  </li>;
}

function TableNode({ database, table, depth }: { database: string; table: DatabaseObject; depth: number }) {
  const [open, setOpen] = useState(false);
  const key = objectChildrenKey(database, table.schema, table.name);
  const children = useStudioStore((state) => state.objectChildren[key]);
  const loading = useStudioStore((state) => state.explorerLoadingObjects.includes(key));
  const error = useStudioStore((state) => state.explorerErrors[key]);
  const loadChildren = useStudioStore((state) => state.loadObjectChildren);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadChildren(database, table.schema, table.name);
  };
  return <li>
    <button type="button" onClick={toggle} className="flex h-6 min-w-max w-full items-center gap-1 pr-2 text-left hover:bg-elevated" style={{ paddingLeft: depth * 18 + 4 }}>
      <Caret open={open} /><Table2 className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{table.schema}.{table.name}</span>{loading && <LoaderCircle className="ml-1 h-3 w-3 animate-spin text-muted" />}
    </button>
    {open && (error ? <button type="button" onClick={() => void loadChildren(database, table.schema, table.name, true)} className="h-6 pl-16 text-[11px] text-red-400">Failed to load · Retry</button> : children ? <ul>{tableGroups.map((group) => <DetailGroup key={group.kind} label={group.label} icon={group.icon} items={children.filter((item) => item.kind === group.kind)} depth={depth + 1} />)}</ul> : <div className="h-6 pl-16 text-[11px] leading-6 text-muted">Loading details…</div>)}
  </li>;
}

function ViewNode({ database, view, depth }: { database: string; view: DatabaseObject; depth: number }) {
  const [open, setOpen] = useState(false);
  const key = objectChildrenKey(database, view.schema, view.name);
  const children = useStudioStore((state) => state.objectChildren[key]);
  const loading = useStudioStore((state) => state.explorerLoadingObjects.includes(key));
  const error = useStudioStore((state) => state.explorerErrors[key]);
  const loadChildren = useStudioStore((state) => state.loadObjectChildren);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadChildren(database, view.schema, view.name);
  };
  return <li>
    <button type="button" onClick={toggle} className="flex h-6 min-w-max w-full items-center gap-1 pr-2 text-left hover:bg-elevated" style={{ paddingLeft: depth * 18 + 4 }}>
      <Caret open={open} /><View className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{view.schema}.{view.name}</span>{loading && <LoaderCircle className="ml-1 h-3 w-3 animate-spin text-muted" />}
    </button>
    {open && (error ? <button type="button" onClick={() => void loadChildren(database, view.schema, view.name, true)} className="h-6 pl-16 text-[11px] text-red-400">Failed to load · Retry</button> : children ? <ul><DetailGroup label="Columns" icon={Columns3} items={children.filter((item) => item.kind === "column")} depth={depth + 1} /></ul> : <div className="h-6 pl-16 text-[11px] leading-6 text-muted">Loading details…</div>)}
  </li>;
}

function RootGroup({ database, group, objects, depth }: { database: string; group: (typeof rootGroups)[number]; objects: DatabaseObject[]; depth: number }) {
  const [open, setOpen] = useState(false);
  const items = objects.filter((item) => item.kind === group.kind);
  const GroupIcon = group.icon;
  return <li>
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-6 min-w-max w-full items-center gap-1 pr-2 text-left hover:bg-elevated" style={{ paddingLeft: depth * 18 + 4 }}>
      <Caret open={open} /><Folder className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{group.label}</span><span className="text-muted">({items.length})</span>
    </button>
    {open && <ul>{items.map((item) => group.kind === "table"
      ? <TableNode key={`${item.schema}-${item.name}`} database={database} table={item} depth={depth + 1} />
      : group.kind === "view"
        ? <ViewNode key={`${item.schema}-${item.name}`} database={database} view={item} depth={depth + 1} />
        : <ObjectLeaf key={`${item.kind}-${item.schema}-${item.name}`} item={item} depth={depth + 1} icon={GroupIcon} />)}</ul>}
  </li>;
}

function DatabaseNode({ database, active }: { database: string; active: boolean }) {
  const [open, setOpen] = useState(active);
  const objects = useStudioStore((state) => state.databaseObjects[database]);
  const loading = useStudioStore((state) => state.explorerLoadingDatabases.includes(database));
  const error = useStudioStore((state) => state.explorerErrors[database]);
  const loadObjects = useStudioStore((state) => state.loadDatabaseObjects);
  useEffect(() => {
    if (active) {
      setOpen(true);
      void loadObjects(database);
    }
  }, [active, database, loadObjects]);
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadObjects(database);
  };
  return <li>
    <button type="button" onClick={toggle} className={cn("flex h-6 min-w-max w-full items-center gap-1 pl-9 pr-2 text-left hover:bg-elevated", active && "font-semibold text-accent")}>
      <Caret open={open} /><Database className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{database}</span>{loading && <LoaderCircle className="ml-1 h-3 w-3 animate-spin text-muted" />}
    </button>
    {open && <ul>{error ? <li><button type="button" onClick={() => void loadObjects(database, true)} title={error} className="h-6 pl-[76px] text-[11px] text-red-400">Failed to load · Retry</button></li> : objects ? rootGroups.map((group) => <RootGroup key={group.kind} database={database} group={group} objects={objects} depth={3} />) : <li className="h-6 pl-[76px] text-[11px] leading-6 text-muted">Loading objects…</li>}</ul>}
  </li>;
}

export function ObjectExplorer() {
  const connectionName = useStudioStore((state) => state.activeConnectionName);
  const activeDatabase = useStudioStore((state) => state.activeDatabase);
  const databases = useStudioStore((state) => state.availableDatabases);
  const request = useStudioStore((state) => state.activeConnectionRequest);
  const loading = useStudioStore((state) => state.explorerLoadingDatabases.length > 0);
  const refresh = useStudioStore((state) => state.refreshExplorer);
  const [serverOpen, setServerOpen] = useState(true);
  const [databasesOpen, setDatabasesOpen] = useState(true);

  return <aside className="flex min-h-0 flex-col overflow-hidden bg-panel">
    <div className="flex h-9 shrink-0 items-center border-b border-border px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
      Object Explorer
      <button type="button" disabled={!request || loading} title="Refresh" onClick={() => void refresh()} className="ml-auto rounded p-1 hover:bg-elevated disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
    </div>
    <div className="min-h-0 flex-1 overflow-auto py-1 text-[12px]">
      {!request ? <button type="button" onClick={() => useStudioStore.getState().openConnectionManager()} className="m-2 rounded border border-border px-3 py-2 text-left text-muted hover:bg-elevated">Click to select a connection</button> : <ul>
        <li>
          <button type="button" onClick={() => setServerOpen((value) => !value)} className="flex h-6 min-w-max w-full items-center gap-1 bg-elevated px-1 text-left font-semibold"><Caret open={serverOpen} /><MonitorCog className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>{connectionName}</span></button>
          {serverOpen && <ul><li>
            <button type="button" onClick={() => setDatabasesOpen((value) => !value)} className="flex h-6 min-w-max w-full items-center gap-1 pl-[22px] pr-2 text-left hover:bg-elevated"><Caret open={databasesOpen} /><Folder className="h-3.5 w-3.5 shrink-0 text-blue-400" /><span>Databases</span><span className="text-muted">({databases.length})</span></button>
            {databasesOpen && <ul>{databases.map((database) => <DatabaseNode key={database} database={database} active={database === activeDatabase} />)}</ul>}
          </li></ul>}
        </li>
      </ul>}
    </div>
    <div className="h-3 shrink-0 border-t border-border bg-elevated" />
  </aside>;
}
