import { create } from "zustand";

type Theme = "light" | "dark";

export interface QueryTab {
  id: string;
  title: string;
  content: string;
  dirty: boolean;
}

interface StudioState {
  theme: Theme;
  explorerWidth: number;
  resultsHeight: number;
  activeQueryTab: string;
  queryTabs: QueryTab[];
  nextQueryNumber: number;
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
  addQueryTab: () => void;
  closeQueryTab: (id: string) => void;
  updateQueryContent: (id: string, content: string) => void;
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
  queryTabs: [{ id: "query-1", title: "Sorgu 1.sql", content: "", dirty: false }],
  nextQueryNumber: 2,
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
  addQueryTab: () => set((state) => {
    const id = `query-${state.nextQueryNumber}`;
    return {
      queryTabs: [...state.queryTabs, { id, title: `Sorgu ${state.nextQueryNumber}.sql`, content: "", dirty: false }],
      activeQueryTab: id,
      nextQueryNumber: state.nextQueryNumber + 1,
    };
  }),
  closeQueryTab: (id) => set((state) => {
    const index = state.queryTabs.findIndex((tab) => tab.id === id);
    const queryTabs = state.queryTabs.filter((tab) => tab.id !== id);
    const activeQueryTab = state.activeQueryTab === id
      ? (queryTabs[Math.min(index, queryTabs.length - 1)]?.id ?? "")
      : state.activeQueryTab;
    return { queryTabs, activeQueryTab };
  }),
  updateQueryContent: (id, content) => set((state) => ({
    queryTabs: state.queryTabs.map((tab) => tab.id === id ? { ...tab, content, dirty: content.length > 0 } : tab),
  })),
  setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
  showPhaseOneMessage: (feature) =>
    set({ statusMessage: `${feature} — Faz 1 arayüz önizlemesi` }),
  openConnectionManager: () => set({ connectionManagerOpen: true }),
  closeConnectionManager: () => set({ connectionManagerOpen: false }),
  setActiveConnection: (activeConnectionName, activeConnectionEnvironment, activeDatabase, availableDatabases) =>
    set({ activeConnectionName, activeConnectionEnvironment, activeDatabase, availableDatabases, statusMessage: `${activeConnectionName} bağlantısı seçildi` }),
  setActiveDatabase: (activeDatabase) => set({ activeDatabase, statusMessage: `${activeDatabase} veritabanı seçildi` }),
}));
