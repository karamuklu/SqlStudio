import { useStudioStore } from "../../store/studio-store";

export function StatusBar() {
  const statusMessage = useStudioStore((state) => state.statusMessage);

  return (
    <footer className="flex items-center gap-4 bg-accent px-1.5 text-[11px] font-medium text-white">
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full border border-white bg-white" /> Bağlı</span>
      <span>{statusMessage}</span>
      <span>00:00:00</span>
      <span>0 satır</span>
      <span className="flex-1" />
      <span>Satır 8, Sütun 24</span>
      <span>v0.2.4</span>
    </footer>
  );
}
