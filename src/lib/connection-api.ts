import { invoke } from "@tauri-apps/api/core";
import type { ConnectionProfile, ConnectionRequest, ConnectionTestResult, SqlInstanceInfo } from "../types/connections";

export const connectionApi = {
  load: () => invoke<ConnectionProfile[]>("load_connection_profiles"),
  save: (profiles: ConnectionProfile[]) => invoke<void>("save_connection_profiles", { profiles }),
  storePassword: (connectionId: string, password: string) => invoke<void>("store_connection_password", { connectionId, password }),
  deletePassword: (connectionId: string) => invoke<void>("delete_connection_password", { connectionId }),
  test: (request: ConnectionRequest) => invoke<ConnectionTestResult>("test_sql_connection", { request }),
  databases: (request: ConnectionRequest) => invoke<string[]>("list_sql_databases", { request }),
  instances: (host: string) => invoke<SqlInstanceInfo[]>("discover_sql_instances", { host }),
};
