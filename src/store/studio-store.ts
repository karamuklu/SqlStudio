import { create } from "zustand";

type Theme = "light" | "dark";

interface StudioState {
  theme: Theme;
  explorerWidth: number;
  resultsHeight: number;
  activeQueryTab: string;
  activeResultTab: "results" | "messages" | "plan";
  statusMessage: string;
  connectionManagerOpen: boolean;
  activeConnectionName: string;
  activeConnectionEnvironment: string;
  activeDatabase: string;
  availableDatabases: string[];
  toggleTheme: () => void;
  setExplorerWidth: (width: number) => void;
  setResultsHeight: (height: number) => void;
  setActiveQueryTab: (tab: string) => void;
  setActiveResultTab: (tab: StudioState["activeResultTab"]) => void;
  showPhaseOneMessage: (feature: string) => void;
  openConnectionManager: () => void;
  closeConnectionManager: () => void;
  setActiveConnection: (name: string, environment: string, database: string, databases: string[]) => void;
  setActiveDatabase: (database: string) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const useStudioStore = create<StudioState>((set) => ({
  theme: "dark",
  explorerWidth: 248,
  resultsHeight: 360,
  activeQueryTab: "query-1",
  activeResultTab: "results",
  statusMessage: "Hazır",
  connectionManagerOpen: false,
  activeConnectionName: "SQLSRV01\\NETSIS",
  activeConnectionEnvironment: "development",
  activeDatabase: "CARI",
  availableDatabases: ["CARI"],
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setExplorerWidth: (width) => set({ explorerWidth: clamp(width, 190, 440) }),
  setResultsHeight: (height) => set({ resultsHeight: clamp(height, 190, 520) }),
  setActiveQueryTab: (activeQueryTab) => set({ activeQueryTab }),
  setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
  showPhaseOneMessage: (feature) =>
    set({ statusMessage: `${feature} — Faz 1 arayüz önizlemesi` }),
  openConnectionManager: () => set({ connectionManagerOpen: true }),
  closeConnectionManager: () => set({ connectionManagerOpen: false }),
  setActiveConnection: (activeConnectionName, activeConnectionEnvironment, activeDatabase, availableDatabases) =>
    set({ activeConnectionName, activeConnectionEnvironment, activeDatabase, availableDatabases, statusMessage: `${activeConnectionName} bağlantısı seçildi` }),
  setActiveDatabase: (activeDatabase) => set({ activeDatabase, statusMessage: `${activeDatabase} veritabanı seçildi` }),
}));
