import { invoke } from "@tauri-apps/api/core";
import type { ConnectionProfile, ConnectionRequest, ConnectionTestResult, DatabaseObjectsResult, QueryExecutionResult, SqlInstanceInfo } from "../types/connections";

export const connectionApi = {
  load: () => invoke<ConnectionProfile[]>("load_connection_profiles"),
  save: (profiles: ConnectionProfile[]) => invoke<void>("save_connection_profiles", { profiles }),
  storePassword: (connectionId: string, password: string) => invoke<void>("store_connection_password", { connectionId, password }),
  deletePassword: (connectionId: string) => invoke<void>("delete_connection_password", { connectionId }),
  test: (request: ConnectionRequest) => invoke<ConnectionTestResult>("test_sql_connection", { request }),
  databases: (request: ConnectionRequest) => invoke<string[]>("list_sql_databases", { request }),
  objects: (request: ConnectionRequest, database: string) => invoke<DatabaseObjectsResult>("load_database_objects", { request, database }),
  execute: (request: ConnectionRequest, database: string, sql: string) => invoke<QueryExecutionResult>("execute_sql_query", { request, database, sql }),
  instances: (host: string) => invoke<SqlInstanceInfo[]>("discover_sql_instances", { host }),
};

