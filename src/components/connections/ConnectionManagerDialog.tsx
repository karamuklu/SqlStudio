import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Database, LoaderCircle, X } from "lucide-react";
import { connectionApi } from "../../lib/connection-api";
import { buildConnectionUrl, validateConnection } from "../../lib/connection-url";
import { useStudioStore } from "../../store/studio-store";
import { createConnection, type ConnectionProfile, type ConnectionTestResult, type SqlInstanceInfo } from "../../types/connections";
import { ConnectionForm } from "./ConnectionForm";
import { ConnectionList } from "./ConnectionList";

type BusyAction = "test" | "instances" | "databases" | null;

export function ConnectionManagerDialog() {
  const open = useStudioStore((state) => state.connectionManagerOpen);
  const close = useStudioStore((state) => state.closeConnectionManager);
  const setActiveConnection = useStudioStore((state) => state.setActiveConnection);
  const [profiles, setProfiles] = useState<ConnectionProfile[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<ConnectionProfile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [instances, setInstances] = useState<SqlInstanceInfo[]>([]);
  const [databases, setDatabases] = useState<Record<string, string[]>>({});
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [result, setResult] = useState<ConnectionTestResult | { success: false; message: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [leftWidth, setLeftWidth] = useState(300);
  const resizing = useRef(false);

  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0];
  const dirtyIds = useMemo(() => new Set(profiles.filter((profile) => JSON.stringify(profile) !== JSON.stringify(savedProfiles.find((item) => item.id === profile.id))).map((profile) => profile.id)), [profiles, savedProfiles]);
  const hasChanges = dirtyIds.size > 0 || savedProfiles.some((saved) => !profiles.some((profile) => profile.id === saved.id));
  const errors = selected ? validateConnection(selected, profiles) : {};

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void connectionApi.load().then((loaded) => {
      if (cancelled) return;
      const normalized = loaded.length ? loaded.map((item, index) => ({ ...createConnection(index + 1), ...item, ssh: { ...createConnection().ssh, ...item.ssh } })) : [createConnection()];
      setProfiles(normalized);
      setSavedProfiles(structuredClone(normalized));
      setSelectedId(normalized[0].id);
      setLoadError("");
    }).catch((error: unknown) => {
      if (cancelled) return;
      const initial = [createConnection()];
      setProfiles(initial); setSavedProfiles([]); setSelectedId(initial[0].id);
      setLoadError(String(error));
    });
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (resizing.current) setLeftWidth(Math.min(440, Math.max(230, event.clientX - Math.max(0, (window.innerWidth - 1080) / 2))));
    };
    const up = () => { resizing.current = false; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  const requestClose = useCallback(() => {
    if (hasChanges && !window.confirm("Kaydedilmemiş değişiklikler silinsin mi?")) return;
    close();
  }, [close, hasChanges]);

  const addProfile = useCallback(() => {
    let index = profiles.length + 1;
    let next = createConnection(index);
    while (profiles.some((item) => item.name === next.name)) next = createConnection(++index);
    setProfiles((current) => [...current, next]); setSelectedId(next.id); setResult(null);
  }, [profiles]);

  const deleteProfile = useCallback((id: string) => {
    const profile = profiles.find((item) => item.id === id);
    if (!profile || !window.confirm(`“${profile.name}” bağlantısı silinsin mi?`)) return;
    const next = profiles.filter((item) => item.id !== id);
    setProfiles(next); setSelectedId(next[0]?.id ?? "");
    void connectionApi.deletePassword(id).catch(() => undefined);
  }, [profiles]);

  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "n") { event.preventDefault(); addProfile(); }
      else if (event.key === "Delete" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); if (selectedId) deleteProfile(selectedId); }
      else if (event.key === "Escape") { event.preventDefault(); requestClose(); }
      else if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); document.getElementById("connection-ok")?.click(); }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [addProfile, deleteProfile, open, requestClose, selectedId]);

  if (!open) return null;

  const updateSelected = (profile: ConnectionProfile) => { setProfiles((current) => current.map((item) => item.id === profile.id ? profile : item)); setResult(null); };
  const request = () => ({ profile: selected, password: passwords[selected.id] || undefined });
  const reportError = (error: unknown) => setResult({ success: false, message: String(error).replace(/^Error:\s*/, "") });

  const testConnection = async () => {
    if (!selected || Object.keys(errors).length) { setResult({ success: false, message: "Önce kırmızı işaretli alanları düzeltin." }); return; }
    setBusyAction("test"); setResult(null);
    try { setResult(await connectionApi.test(request())); } catch (error) { reportError(error); } finally { setBusyAction(null); }
  };

  const loadDatabases = async () => {
    if (!selected || Object.keys(errors).length) { setResult({ success: false, message: "Veritabanlarını listelemek için bağlantı alanlarını tamamlayın." }); return; }
    setBusyAction("databases");
    try { const names = await connectionApi.databases(request()); setDatabases((current) => ({ ...current, [selected.id]: names })); setResult({ success: true, durationMs: 0, serverVersion: "", serverName: selected.host, message: `${names.length} veritabanı listelendi.` }); } catch (error) { reportError(error); } finally { setBusyAction(null); }
  };

  const discoverInstances = async () => {
    if (!selected?.host.trim()) return;
    setBusyAction("instances");
    try {
      const found = await connectionApi.instances(selected.host);
      setInstances(found);
      const matching = found.find((item) => item.name.toLocaleLowerCase("tr") === selected.instance.toLocaleLowerCase("tr")) ?? (found.length === 1 ? found[0] : undefined);
      if (matching) {
        const next = { ...selected, instance: matching.name, port: matching.port };
        updateSelected({ ...next, url: buildConnectionUrl(next) });
      }
      setResult({ success: true, durationMs: 0, serverVersion: "", serverName: selected.host, message: found.length ? `${found.length} SQL Server örneği bulundu: ${found.map((item) => `${item.name} (${item.port})`).join(", ")}` : "SQL Browser örnek döndürmedi." });
    } catch (error) { reportError(error); } finally { setBusyAction(null); }
  };

  const apply = async () => {
    if (!selected || Object.keys(errors).length) { setResult({ success: false, message: "Önce kırmızı işaretli alanları düzeltin." }); return false; }
    try {
      await connectionApi.save(profiles);
      for (const profile of profiles) {
        const password = passwords[profile.id];
        if (profile.savePassword === "always" && password) await connectionApi.storePassword(profile.id, password);
        else if (profile.savePassword === "never") await connectionApi.deletePassword(profile.id);
      }
      setSavedProfiles(structuredClone(profiles));
      setResult({ success: true, durationMs: 0, serverVersion: "", serverName: selected.host, message: "Bağlantı ayarları kaydedildi." });
      return true;
    } catch (error) { reportError(error); return false; }
  };

  const confirm = async () => {
    if (!(await apply())) return;
    const available = databases[selected.id] ?? (selected.database ? [selected.database] : []);
    setActiveConnection(selected.name, selected.environment, selected.database || available[0] || "master", available);
    close();
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="connection-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5 backdrop-blur-[2px]">
    <div className="flex h-[min(760px,calc(100vh-40px))] w-[min(1120px,calc(100vw-40px))] min-h-[620px] min-w-[900px] resize overflow-hidden rounded-xl border border-border bg-background shadow-[0_24px_90px_rgba(0,0,0,.55)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-border bg-panel px-4">
          <Database className="mr-2 h-4 w-4 text-accent" /><h2 id="connection-dialog-title" className="text-sm font-semibold">Veri Kaynakları ve Sürücüler</h2><span className="ml-3 text-[10px] text-muted">Microsoft SQL Server</span><button type="button" onClick={requestClose} aria-label="Kapat" className="ml-auto rounded-md p-1.5 text-muted hover:bg-elevated hover:text-foreground"><X className="h-4 w-4" /></button>
        </header>
        {loadError && <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-300">Kayıtlı bağlantılar okunamadı; yeni liste açıldı: {loadError}</div>}
        <main className="flex min-h-0 flex-1">
          <div style={{ width: leftWidth }} className="shrink-0"><ConnectionList profiles={profiles} selectedId={selected?.id ?? ""} dirtyIds={dirtyIds} onSelect={(id) => { setSelectedId(id); setResult(null); }} onAdd={addProfile} onDuplicate={(id) => { const source = profiles.find((item) => item.id === id); if (!source) return; const copy = { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} kopya` }; setProfiles((current) => [...current, copy]); setSelectedId(copy.id); }} onDelete={deleteProfile} onRename={(id, name) => setProfiles((current) => current.map((item) => item.id === id ? { ...item, name } : item))} onReorder={(sourceId, targetId) => { if (!sourceId || sourceId === targetId) return; setProfiles((current) => { const copy = [...current]; const from = copy.findIndex((item) => item.id === sourceId), to = copy.findIndex((item) => item.id === targetId); const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy; }); }} onImport={(incoming) => setProfiles((current) => [...current, ...incoming])} onTest={() => void testConnection()} /></div>
          <div onPointerDown={() => { resizing.current = true; }} className="w-1 shrink-0 cursor-col-resize bg-border transition hover:bg-accent" />
          {selected ? <ConnectionForm profile={selected} password={passwords[selected.id] ?? ""} errors={errors} instances={instances} databases={databases[selected.id] ?? []} busyAction={busyAction} onChange={updateSelected} onPasswordChange={(password) => setPasswords((current) => ({ ...current, [selected.id]: password }))} onDiscoverInstances={() => void discoverInstances()} onLoadDatabases={() => void loadDatabases()} /> : <div className="flex flex-1 items-center justify-center text-xs text-muted">Yeni bir bağlantı ekleyin.</div>}
        </main>
        <footer className="flex min-h-14 shrink-0 items-center gap-3 border-t border-border bg-panel px-4 py-2">
          <button type="button" disabled={!selected || busyAction !== null} onClick={() => void testConnection()} className="inline-flex items-center gap-2 text-xs font-medium text-accent hover:underline disabled:opacity-50">{busyAction === "test" && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}Bağlantıyı test et</button>
          {result && <div className={`flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${result.success ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{result.success ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}<span className="max-w-[430px] truncate" title={result.message}>{result.message}{"durationMs" in result && result.durationMs > 0 ? ` ${result.durationMs} ms · SQL Server ${result.serverVersion}` : ""}</span></div>}
          <span className="ml-auto text-[10px] text-muted">Microsoft SQL Server</span>
          <button type="button" onClick={requestClose} className="dialog-button">İptal</button><button type="button" disabled={!hasChanges || !selected} onClick={() => void apply()} className="dialog-button disabled:opacity-40">Uygula</button><button id="connection-ok" type="button" disabled={!selected} onClick={() => void confirm()} className="dialog-button border-accent bg-accent text-accent-foreground hover:bg-accent/90">Tamam</button>
        </footer>
      </div>
    </div>
  </div>;
}
