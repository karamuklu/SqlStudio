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
import { Button } from "../ui/button";
import { useStudioStore } from "../../store/studio-store";

export function Toolbar() {
  const theme = useStudioStore((state) => state.theme);
  const toggleTheme = useStudioStore((state) => state.toggleTheme);
  const showMessage = useStudioStore((state) => state.showPhaseOneMessage);
  const openConnectionManager = useStudioStore((state) => state.openConnectionManager);
  const activeConnectionName = useStudioStore((state) => state.activeConnectionName);
  const activeConnectionEnvironment = useStudioStore((state) => state.activeConnectionEnvironment);
  const activeDatabase = useStudioStore((state) => state.activeDatabase);
  const availableDatabases = useStudioStore((state) => state.availableDatabases);
  const setActiveDatabase = useStudioStore((state) => state.setActiveDatabase);

  return (
    <header className="flex min-w-0 items-center gap-1.5 border-b border-border bg-panel px-1.5">
      <Button variant="outline" className={`shrink-0 ${activeConnectionEnvironment === "production" ? "border-red-500/60 bg-red-500/10" : ""}`} onClick={openConnectionManager}>
        <span className={`h-2 w-2 rounded-full ${activeConnectionEnvironment === "production" ? "bg-red-500" : "bg-emerald-500"}`} />
        {activeConnectionName}
      </Button>
      <label className="relative shrink-0"><span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2"><Database className="h-3.5 w-3.5" /></span><select aria-label="Aktif veritabanı" value={activeDatabase} onChange={(event) => setActiveDatabase(event.target.value)} className="h-8 appearance-none rounded-md border border-border bg-panel pl-7 pr-7 text-xs font-medium outline-none hover:bg-elevated">{availableDatabases.length ? availableDatabases.map((name) => <option key={name}>{name}</option>) : <option>{activeDatabase}</option>}</select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" /></label>
      <div className="mx-1 h-5 w-px bg-border" />
      <Button variant="default" className="shrink-0" onClick={() => showMessage("Çalıştır")}>
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
      <Button className="shrink-0" onClick={() => showMessage("Güncelleme denetimi")}>
        <CloudDownload className="h-3.5 w-3.5" /> Güncellemeleri denetle
      </Button>
      <Button className="shrink-0" onClick={toggleTheme} aria-label="Temayı değiştir">
        {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} Tema
      </Button>
    </header>
  );
}
