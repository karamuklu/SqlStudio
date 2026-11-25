import { create } from "zustand";
import { connectionApi } from "../lib/connection-api";
import type { ConnectionRequest, DatabaseObject, QueryExecutionResult } from "../types/connections";

type Theme = "light" | "dark";

export interface QueryTab {
  id: string;
  title: string;
  content: string;
  dirty: boolean;
}

const emptyResult: QueryExecutionResult = { columns: [], rows: [], durationMs: 0, message: "Henüz sorgu çalıştırılmadı.", truncated: false };

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
  activeConnectionRequest: ConnectionRequest | null;
  databaseObjects: DatabaseObject[];
  explorerLoading: boolean;
  queryRunning: boolean;
  queryResult: QueryExecutionResult;
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
  activateConnection: (request: ConnectionRequest, databases: string[]) => Promise<void>;
  setActiveDatabase: (database: string) => Promise<void>;
  refreshExplorer: () => Promise<void>;
  runActiveQuery: () => Promise<void>;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const errorMessage = (error: unknown) => String(error).replace(/^Error:\s*/, "");

export const useStudioStore = create<StudioState>((set, get) => ({
  theme: "dark",
  explorerWidth: 248,
  resultsHeight: 360,
  activeQueryTab: "query-1",
  queryTabs: [{ id: "query-1", title: "Sorgu 1.sql", content: "", dirty: false }],
  nextQueryNumber: 2,
  activeResultTab: "results",
  statusMessage: "Bağlantı seçin",
  connectionManagerOpen: false,
  activeConnectionName: "Bağlantı seç",
  activeConnectionEnvironment: "development",
  activeDatabase: "master",
  availableDatabases: [],
  activeConnectionRequest: null,
  databaseObjects: [],
  explorerLoading: false,
  queryRunning: false,
  queryResult: emptyResult,
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
  setExplorerWidth: (width) => set({ explorerWidth: clamp(width, 190, 440) }),
  setResultsHeight: (height) => set({ resultsHeight: clamp(height, 190, 520) }),
  setActiveQueryTab: (activeQueryTab) => set({ activeQueryTab }),
  addQueryTab: () => set((state) => {
    const id = `query-${state.nextQueryNumber}`;
    return { queryTabs: [...state.queryTabs, { id, title: `Sorgu ${state.nextQueryNumber}.sql`, content: "", dirty: false }], activeQueryTab: id, nextQueryNumber: state.nextQueryNumber + 1 };
  }),
  closeQueryTab: (id) => set((state) => {
    const index = state.queryTabs.findIndex((tab) => tab.id === id);
    const queryTabs = state.queryTabs.filter((tab) => tab.id !== id);
    const activeQueryTab = state.activeQueryTab === id ? (queryTabs[Math.min(index, queryTabs.length - 1)]?.id ?? "") : state.activeQueryTab;
    return { queryTabs, activeQueryTab };
  }),
  updateQueryContent: (id, content) => set((state) => ({ queryTabs: state.queryTabs.map((tab) => tab.id === id ? { ...tab, content, dirty: content.length > 0 } : tab) })),
  setActiveResultTab: (activeResultTab) => set({ activeResultTab }),
  showPhaseOneMessage: (feature) => set({ statusMessage: `${feature} henüz etkin değil` }),
  openConnectionManager: () => set({ connectionManagerOpen: true }),
  closeConnectionManager: () => set({ connectionManagerOpen: false }),
  activateConnection: async (request, databases) => {
    const database = request.profile.database || databases[0] || "master";
    set({ activeConnectionName: request.profile.name, activeConnectionEnvironment: request.profile.environment, activeConnectionRequest: request, activeDatabase: database, availableDatabases: databases.length ? databases : [database], databaseObjects: [], statusMessage: `${request.profile.name} bağlantısı seçildi` });
    await get().refreshExplorer();
  },
  setActiveDatabase: async (activeDatabase) => {
    set({ activeDatabase, databaseObjects: [], statusMessage: `${activeDatabase} yükleniyor…` });
    await get().refreshExplorer();
  },
  refreshExplorer: async () => {
    const { activeConnectionRequest, activeDatabase } = get();
    if (!activeConnectionRequest) return;
    set({ explorerLoading: true });
    try {
      const result = await connectionApi.objects(activeConnectionRequest, activeDatabase);
      set({ databaseObjects: result.objects, statusMessage: `${result.database}: ${result.objects.length} nesne yüklendi` });
    } catch (error) {
      set({ databaseObjects: [], statusMessage: `Nesne gezgini: ${errorMessage(error)}` });
    } finally {
      set({ explorerLoading: false });
    }
  },
  runActiveQuery: async () => {
    const state = get();
    const sql = state.queryTabs.find((tab) => tab.id === state.activeQueryTab)?.content.trim() ?? "";
    if (!state.activeConnectionRequest) {
      set({ activeResultTab: "messages", queryResult: { ...emptyResult, message: "Önce üst soldaki bağlantı düğmesinden bir bağlantı seçin." }, statusMessage: "Bağlantı seçilmedi" });
      return;
    }
    if (!sql) {
      set({ activeResultTab: "messages", queryResult: { ...emptyResult, message: "Editöre bir SQL sorgusu yazın." }, statusMessage: "Sorgu boş" });
      return;
    }
    set({ queryRunning: true, statusMessage: "Sorgu çalıştırılıyor…" });
    try {
      const queryResult = await connectionApi.execute(state.activeConnectionRequest, state.activeDatabase, sql);
      set({ queryResult, activeResultTab: queryResult.columns.length ? "results" : "messages", statusMessage: `${queryResult.rows.length} satır · ${queryResult.durationMs} ms` });
    } catch (error) {
      set({ queryResult: { ...emptyResult, message: errorMessage(error) }, activeResultTab: "messages", statusMessage: "Sorgu hatası" });
    } finally {
      set({ queryRunning: false });
    }
  },
}));

