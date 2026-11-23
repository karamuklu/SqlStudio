import { useState, type CSSProperties } from "react";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Database,
  Folder,
  FunctionSquare,
  MonitorCog,
  Table2,
  View,
} from "lucide-react";
import { objectTree, type TreeKind, type TreeNodeData } from "../../data/mock-data";
import { cn } from "../../lib/cn";

const icons: Record<TreeKind, typeof Folder> = {
  server: MonitorCog,
  database: Database,
  folder: Folder,
  table: Table2,
  view: View,
  procedure: Boxes,
  function: FunctionSquare,
};

const initialExpanded = new Set([
  "server",
  "databases",
  "cari",
  "views",
  "procedures",
  "functions",
]);

function TreeNode({ node, depth }: { node: TreeNodeData; depth: number }) {
  const [expanded, setExpanded] = useState(initialExpanded.has(node.id));
  const hasChildren = Boolean(node.children?.length);
  const Icon = icons[node.kind];

  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex h-6 w-full items-center gap-1 whitespace-nowrap rounded-sm pr-2 text-left text-[12px] hover:bg-elevated",
          node.kind === "server" && "bg-elevated font-semibold",
        )}
        style={{ paddingLeft: depth * 18 + 4 }}
        onClick={() => hasChildren && setExpanded((value) => !value)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" />
        ) : (
          <span className="w-3.5" />
        )}
        <Icon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
        <span className="truncate">{node.label}</span>
      </button>
      {expanded && hasChildren ? (
        <ul className="relative before:absolute before:bottom-1 before:top-0 before:w-px before:bg-border" style={{ "--tree-line": `${depth * 18 + 11}px` } as CSSProperties}>
          {node.children?.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} />)}
        </ul>
      ) : null}
    </li>
  );
}

export function ObjectExplorer() {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-panel">
      <div className="flex h-9 shrink-0 items-center border-b border-border px-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Nesne gezgini
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-1">
        <ul>
          {objectTree.map((node) => <TreeNode key={node.id} node={node} depth={0} />)}
        </ul>
      </div>
      <div className="h-3 shrink-0 overflow-hidden border-t border-border bg-elevated">
        <div className="mt-1 h-1.5 w-4/5 rounded-full bg-muted/60" />
      </div>
    </aside>
  );
}
