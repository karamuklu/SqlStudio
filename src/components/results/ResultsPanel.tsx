import { useMemo, useState } from "react";
import { type ColumnDef, type ColumnFiltersState, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDownToLine, Braces, ChevronDown, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";
import { useStudioStore } from "../../store/studio-store";
import type { SqlValue } from "../../types/connections";

function ResultTable() {
  const result = useStudioStore((state) => state.queryResult);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const columns = useMemo<ColumnDef<SqlValue[]>[]>(() => result.columns.map((name, index) => ({
    id: `column-${index}`,
    accessorFn: (row) => row[index],
    header: name || `(Sütun ${index + 1})`,
    size: 180,
    filterFn: (row, columnId, value: string) => String(row.getValue(columnId) ?? "").toLocaleLowerCase("tr").includes(value.toLocaleLowerCase("tr")),
  })), [result.columns]);
  const table = useReactTable({ data: result.rows, columns, state: { columnFilters }, onColumnFiltersChange: setColumnFilters, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  if (!result.columns.length) return <div className="flex flex-1 items-center justify-center text-xs text-muted">Sonuç döndüren bir sorgu çalıştırın.</div>;
  return <div className="min-h-0 flex-1 overflow-auto">
    <table className="w-full table-fixed border-collapse font-mono text-[11px]" style={{ minWidth: Math.max(820, result.columns.length * 180) }}>
      <thead className="sticky top-0 z-10 bg-elevated">
        {table.getHeaderGroups().map((group) => <tr key={group.id}><th className="w-12 border-b border-r border-border" rowSpan={2} />{group.headers.map((header) => <th key={header.id} style={{ width: header.getSize() }} className="border-b border-r border-border px-2 py-1.5 text-left font-sans text-[11px] font-semibold"><button type="button" className="flex w-full items-center justify-between" onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}{header.column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3 text-accent" /> : <ChevronsUpDown className="h-3 w-3 text-muted" />}</button></th>)}</tr>)}
        <tr>{table.getLeafHeaders().map((header) => <th key={`${header.id}-filter`} className="border-b border-r border-border px-1.5 py-1"><input value={(header.column.getFilterValue() ?? "") as string} onChange={(event) => header.column.setFilterValue(event.target.value)} placeholder="Filtre..." className="h-6 w-full rounded border border-border bg-background px-2 font-sans text-[10px] text-foreground outline-none placeholder:text-muted focus:border-accent" /></th>)}</tr>
      </thead>
      <tbody>{table.getRowModel().rows.map((row, index) => <tr key={row.id} className="odd:bg-background even:bg-panel hover:bg-blue-500/10"><td className="border-b border-r border-border px-2 py-1 text-center text-muted">{index + 1}</td>{row.getVisibleCells().map((cell) => { const value = cell.getValue<SqlValue>(); return <td key={cell.id} title={value === null ? "NULL" : String(value)} className="truncate border-b border-r border-border px-2 py-1.5">{value === null ? <span className="italic text-muted">NULL</span> : String(value)}</td>; })}</tr>)}</tbody>
    </table>
  </div>;
}

export function ResultsPanel() {
  const activeTab = useStudioStore((state) => state.activeResultTab);
  const setActiveTab = useStudioStore((state) => state.setActiveResultTab);
  const showMessage = useStudioStore((state) => state.showPhaseOneMessage);
  const result = useStudioStore((state) => state.queryResult);
  const running = useStudioStore((state) => state.queryRunning);
  return <section className="flex min-h-0 flex-col border-t border-border bg-panel">
    <div className="flex h-10 shrink-0 items-center border-b border-border px-2"><nav className="flex h-full items-end gap-1">{([["results", "Sonuçlar"], ["messages", "Mesajlar"], ["plan", "Yürütme planı"]] as const).map(([id, label]) => <button type="button" key={id} onClick={() => setActiveTab(id)} className={cn("h-full border-b-2 border-transparent px-3 text-xs text-muted", activeTab === id && "border-accent text-accent")}>{label}</button>)}</nav>{running && <span className="ml-2 flex items-center gap-1 text-xs text-accent"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />Çalıştırılıyor</span>}<div className="flex-1" /><button type="button" onClick={() => showMessage("CSV dışa aktarma")} className="export-button"><ArrowDownToLine /> CSV</button><button type="button" onClick={() => showMessage("Excel dışa aktarma")} className="export-button"><ArrowDownToLine /> Excel</button><button type="button" onClick={() => showMessage("JSON dışa aktarma")} className="export-button"><Braces /> JSON</button></div>
    {activeTab === "results" ? <ResultTable /> : activeTab === "messages" ? <div className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-xs">{result.message}{result.truncated ? "\nİlk 100.000 satır gösteriliyor." : ""}</div> : <div className="flex flex-1 items-center justify-center text-xs text-muted">Yürütme planı henüz etkin değil.</div>}
  </section>;
}

