import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDownToLine, Braces, ChevronDown, ChevronsUpDown } from "lucide-react";
import { mockResults, type ResultRow } from "../../data/mock-data";
import { cn } from "../../lib/cn";
import { useStudioStore } from "../../store/studio-store";
import { numericFilter } from "./result-filter";

const balanceFilter: FilterFn<ResultRow> = (row, columnId, filterValue: string) =>
  numericFilter(row.getValue<number>(columnId), filterValue);

const columns: ColumnDef<ResultRow>[] = [
  { accessorKey: "stockCode", header: "STOK_KODU", size: 168 },
  { accessorKey: "stockName", header: "STOK_ADI", size: 260 },
  { accessorKey: "groupCode", header: "GRUP_KODU", size: 175 },
  {
    accessorKey: "balance",
    header: "BAKIYE",
    size: 165,
    filterFn: balanceFilter,
    cell: ({ getValue }) => <span className="block text-right font-semibold text-blue-200 dark:text-blue-100">{getValue<number>().toLocaleString("tr-TR")}</span>,
  },
  { accessorKey: "lastMovement", header: "SON_HAREKET", size: 185 },
];

function ResultTable() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    { id: "balance", value: ">1000" },
  ]);
  const data = useMemo(() => mockResults, []);
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full min-w-[820px] table-fixed border-collapse font-mono text-[11px]">
        <thead className="sticky top-0 z-10 bg-elevated">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              <th className="w-12 border-b border-r border-border" rowSpan={2} />
              {group.headers.map((header) => (
                <th key={header.id} style={{ width: header.getSize() }} className="border-b border-r border-border px-2 py-1.5 text-left font-sans text-[11px] font-semibold">
                  <button type="button" className="flex w-full items-center justify-between" onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "desc" ? <ChevronDown className="h-3 w-3 text-accent" /> : <ChevronsUpDown className="h-3 w-3 text-muted" />}
                  </button>
                </th>
              ))}
            </tr>
          ))}
          <tr>
            {table.getLeafHeaders().map((header) => (
              <th key={`${header.id}-filter`} className="border-b border-r border-border px-1.5 py-1">
                <input
                  value={(header.column.getFilterValue() ?? "") as string}
                  onChange={(event) => header.column.setFilterValue(event.target.value)}
                  placeholder={header.id === "balance" ? "Filtre: >1000" : "Filtre..."}
                  className="h-6 w-full rounded border border-border bg-background px-2 font-sans text-[10px] text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr key={row.id} className="odd:bg-background even:bg-panel hover:bg-blue-500/10">
              <td className="border-b border-r border-border px-2 py-1 text-center text-muted">{index + 1}</td>
              {row.getVisibleCells().map((cell) => {
                const value = cell.getValue();
                return (
                  <td key={cell.id} className="truncate border-b border-r border-border px-2 py-1.5">
                    {value === null ? <span className="italic text-muted">NULL</span> : flexRender(cell.column.columnDef.cell, cell.getContext()) || String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResultsPanel() {
  const activeTab = useStudioStore((state) => state.activeResultTab);
  const setActiveTab = useStudioStore((state) => state.setActiveResultTab);
  const showMessage = useStudioStore((state) => state.showPhaseOneMessage);

  return (
    <section className="flex min-h-0 flex-col border-t border-border bg-panel">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-2">
        <nav className="flex h-full items-end gap-1">
          {([
            ["results", "Sonuçlar"],
            ["messages", "Mesajlar"],
            ["plan", "Yürütme planı"],
          ] as const).map(([id, label]) => (
            <button
              type="button"
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn("h-full border-b-2 border-transparent px-3 text-xs text-muted", activeTab === id && "border-accent text-accent")}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="flex-1" />
        <button type="button" onClick={() => showMessage("CSV dışa aktarma")} className="export-button"><ArrowDownToLine /> CSV</button>
        <button type="button" onClick={() => showMessage("Excel dışa aktarma")} className="export-button"><ArrowDownToLine /> Excel</button>
        <button type="button" onClick={() => showMessage("JSON dışa aktarma")} className="export-button"><Braces /> JSON</button>
      </div>
      {activeTab === "results" ? <ResultTable /> : (
        <div className="flex flex-1 items-center justify-center text-xs text-muted">
          {activeTab === "messages" ? "Faz 1 mesaj önizlemesi" : "Faz 1 yürütme planı önizlemesi"}
        </div>
      )}
    </section>
  );
}
