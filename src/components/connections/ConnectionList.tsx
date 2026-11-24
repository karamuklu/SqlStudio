import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Copy, Download, MoreHorizontal, Plus, Search, Settings2, Trash2, Upload } from "lucide-react";
import type { ConnectionProfile } from "../../types/connections";

interface Props {
  profiles: ConnectionProfile[];
  selectedId: string;
  dirtyIds: Set<string>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (sourceId: string, targetId: string) => void;
  onImport: (profiles: ConnectionProfile[]) => void;
  onTest: () => void;
}

const environmentLabel: Record<string, string> = { production: "Prod", test: "Test", development: "Geliştirme", custom: "Özel" };

export function ConnectionList({ profiles, selectedId, dirtyIds, onSelect, onAdd, onDuplicate, onDelete, onRename, onReorder, onImport, onTest }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const filtered = profiles.filter((profile) => `${profile.name} ${profile.host} ${profile.database}`.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));

  const exportProfiles = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sqlstudio-connections.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProfiles = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as ConnectionProfile[];
      if (!Array.isArray(parsed)) throw new Error();
      onImport(parsed.map((item) => ({ ...item, id: item.id || crypto.randomUUID() })));
    } catch {
      window.alert("Dosya geçerli bir SqlStudio bağlantı dışa aktarımı değil.");
    }
  };

  return (
    <aside className="flex h-full min-w-[230px] flex-col border-r border-border bg-panel">
      <div className="flex h-11 items-end gap-1 border-b border-border px-2 text-[12px] font-medium">
        <button className="h-9 border-b-2 border-accent px-2 text-foreground">Veri Kaynakları</button>
        <button className="h-9 px-2 text-muted hover:text-foreground">Sürücüler</button>
        <button className="h-9 px-2 text-muted hover:text-foreground">DDL Eşlemeleri</button>
      </div>
      <div className="flex items-center gap-0.5 border-b border-border p-2">
        <Tool title="SQL Server ekle (Ctrl+N)" onClick={onAdd}><Plus /></Tool>
        <Tool title="Sil (Delete)" onClick={() => selectedId && onDelete(selectedId)}><Trash2 /></Tool>
        <Tool title="Çoğalt" onClick={() => selectedId && onDuplicate(selectedId)}><Copy /></Tool>
        <Tool title="Ayarlar"><Settings2 /></Tool>
        <Tool title="Dışa aktar" onClick={exportProfiles}><Download /></Tool>
        <Tool title="İçe aktar" onClick={() => importRef.current?.click()}><Upload /></Tool>
        <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void importProfiles(event.target.files?.[0])} />
        <span className="flex-1" />
        <Tool title="Geri"><ArrowLeft /></Tool><Tool title="İleri"><ArrowRight /></Tool>
      </div>
      <div className="p-2 pb-1">
        <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-2 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30">
          <Search className="h-3.5 w-3.5 text-muted" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bağlantılarda ara" className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
        </label>
      </div>
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Proje veri kaynakları</div>
      <div className="min-h-0 flex-1 overflow-auto px-1.5">
        {filtered.map((profile) => (
          <div
            key={profile.id}
            draggable
            onDragStart={(event) => event.dataTransfer.setData("text/plain", profile.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => onReorder(event.dataTransfer.getData("text/plain"), profile.id)}
            onClick={() => onSelect(profile.id)}
            onDoubleClick={() => setEditingId(profile.id)}
            onContextMenu={(event) => { event.preventDefault(); setMenuId(profile.id); onSelect(profile.id); }}
            className={`group relative flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-xs ${selectedId === profile.id ? "bg-accent/15 text-foreground ring-1 ring-accent/25" : "hover:bg-elevated"}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background" style={{ backgroundColor: profile.color }} title={environmentLabel[profile.environment]} />
            {editingId === profile.id ? (
              <input autoFocus defaultValue={profile.name} onClick={(event) => event.stopPropagation()} onBlur={(event) => { onRename(profile.id, event.target.value); setEditingId(null); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="min-w-0 flex-1 rounded border border-accent bg-background px-1.5 py-1 outline-none" />
            ) : <span className="min-w-0 flex-1 truncate">{profile.name}</span>}
            {dirtyIds.has(profile.id) && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Kaydedilmemiş değişiklik" />}
            <button onClick={(event) => { event.stopPropagation(); setMenuId(menuId === profile.id ? null : profile.id); }} className="invisible rounded p-1 group-hover:visible"><MoreHorizontal className="h-3.5 w-3.5" /></button>
            {menuId === profile.id && (
              <div onMouseLeave={() => setMenuId(null)} className="absolute right-1 top-8 z-30 w-40 rounded-lg border border-border bg-background p-1 shadow-2xl">
                <MenuItem onClick={() => { onTest(); setMenuId(null); }}>Bağlantı testi</MenuItem>
                <MenuItem onClick={() => { onDuplicate(profile.id); setMenuId(null); }}>Çoğalt</MenuItem>
                <MenuItem onClick={() => { setEditingId(profile.id); setMenuId(null); }}>Yeniden adlandır</MenuItem>
                <MenuItem danger onClick={() => { onDelete(profile.id); setMenuId(null); }}>Sil</MenuItem>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="px-3 py-8 text-center text-xs text-muted">Bağlantı bulunamadı.</p>}
      </div>
    </aside>
  );
}

function Tool({ title, onClick, children }: { title: string; onClick?: () => void; children: React.ReactNode }) {
  return <button type="button" title={title} onClick={onClick} className="rounded-md p-1.5 text-muted transition hover:bg-elevated hover:text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5">{children}</button>;
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-elevated ${danger ? "text-red-400" : ""}`}>{children}</button>;
}
