import {
  Check,
  ChevronDown,
  CircleStop,
  CloudDownload,
  Database,
  Moon,
  Play,
  Sun,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { Button } from "../ui/button";
import { useStudioStore } from "../../store/studio-store";

export function Toolbar() {
  const [version, setVersion] = useState("0.2.3");
  const [updateLabel, setUpdateLabel] = useState("Güncellemeleri denetle");
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const theme = useStudioStore((state) => state.theme);
  const toggleTheme = useStudioStore((state) => state.toggleTheme);
  const showMessage = useStudioStore((state) => state.showPhaseOneMessage);
  const runActiveQuery = useStudioStore((state) => state.runActiveQuery);
  const queryRunning = useStudioStore((state) => state.queryRunning);
  const openConnectionManager = useStudioStore((state) => state.openConnectionManager);
  const activeConnectionName = useStudioStore((state) => state.activeConnectionName);
  const activeConnectionEnvironment = useStudioStore((state) => state.activeConnectionEnvironment);
  const activeDatabase = useStudioStore((state) => state.activeDatabase);
  const availableDatabases = useStudioStore((state) => state.availableDatabases);
  const setActiveDatabase = useStudioStore((state) => state.setActiveDatabase);

  useEffect(() => {
    void getVersion().then(setVersion).catch(() => undefined);
  }, []);

  const checkForUpdates = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    setUpdateLabel("Denetleniyor…");
    try {
      const update = await check({ timeout: 30_000 });
      if (!update) {
        setUpdateLabel("Güncel");
        window.alert(`SqlStudio v${version} güncel.`);
        return;
      }
      const accepted = window.confirm(
        `SqlStudio v${update.version} hazır. Şimdi indirip kurulsun mu?\n\n${update.body ?? ""}`,
      );
      if (!accepted) {
        setUpdateLabel(`v${update.version} hazır`);
        return;
      }
      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          const percent = total ? Math.min(99, Math.round((downloaded / total) * 100)) : 0;
          setUpdateLabel(percent ? `İndiriliyor %${percent}` : "İndiriliyor…");
        }
        if (event.event === "Finished") setUpdateLabel("Kuruluyor…");
      });
      await relaunch();
    } catch (error) {
      const message = String(error).replace(/^Error:\s*/, "");
      setUpdateLabel("Güncelleme hatası");
      window.alert(`Güncelleme denetlenemedi:\n${message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <header className="flex min-w-0 items-center gap-1.5 border-b border-border bg-panel px-1.5">
      <Button variant="outline" className={`shrink-0 ${activeConnectionEnvironment === "production" ? "border-red-500/60 bg-red-500/10" : ""}`} onClick={openConnectionManager}>
        <span className={`h-2 w-2 rounded-full ${activeConnectionEnvironment === "production" ? "bg-red-500" : "bg-emerald-500"}`} />
        {activeConnectionName}
      </Button>
      <label className="relative shrink-0"><span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"><Database className="h-3.5 w-3.5" /></span><select aria-label="Aktif veritabanı" value={activeDatabase} onChange={(event) => void setActiveDatabase(event.target.value)} className="h-8 appearance-none rounded-md border border-border bg-panel pl-7 pr-7 text-xs font-medium outline-none hover:bg-elevated">{availableDatabases.length ? availableDatabases.map((name) => <option key={name}>{name}</option>) : <option>{activeDatabase}</option>}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" /></label>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button variant="default" className="shrink-0" disabled={queryRunning} onClick={() => void runActiveQuery()}>
        <Play className="h-3.5 w-3.5 fill-current" /> Çalıştır <kbd>F5</kbd>
      </Button>
      <Button className="shrink-0" onClick={() => showMessage("Durdur")}>
        <CircleStop className="h-3.5 w-3.5" /> Durdur
      </Button>
      <Button className="shrink-0" onClick={() => showMessage("Doğrula")}>
        <Check className="h-3.5 w-3.5" /> Doğrula
      </Button>
      <Button className="shrink-0" onClick={() => showMessage("Yürütme planı")}>
        <Workflow className="h-3.5 w-3.5" /> Yürütme planı
      </Button>
      <div className="flex-1" />
      <Button className="shrink-0" disabled={checkingUpdate} onClick={() => void checkForUpdates()}>
        <CloudDownload className={`h-3.5 w-3.5 ${checkingUpdate ? "animate-pulse" : ""}`} /> {updateLabel} <span className="text-[10px] text-muted">v{version}</span>
      </Button>
      <Button className="shrink-0" onClick={toggleTheme} aria-label="Temayı değiştir">
        {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} Tema
      </Button>
    </header>
  );
}

