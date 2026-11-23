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

  return (
    <header className="flex min-w-0 items-center gap-1.5 border-b border-border bg-panel px-1.5">
      <Button variant="outline" className="shrink-0" onClick={() => showMessage("Bağlantı seçici")}>
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        SQLSRV01\NETSIS
      </Button>
      <Button variant="outline" className="shrink-0" onClick={() => showMessage("Veritabanı seçici")}>
        <Database className="h-3.5 w-3.5" /> CARI <ChevronDown className="h-3 w-3" />
      </Button>
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
