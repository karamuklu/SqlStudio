export type AuthType = "integrated" | "sqlServer" | "azureAdPassword" | "none";
export type SavePassword = "always" | "session" | "never";
export type Environment = "production" | "test" | "development" | "custom";

export interface SshConfig {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  authMethod: "password" | "privateKey";
  privateKeyPath: string;
}

export interface AdvancedProperty {
  key: string;
  value: string;
}

export interface ConnectionProfile {
  id: string;
  name: string;
  description: string;
  color: string;
  environment: Environment;
  host: string;
  port: number;
  instance: string;
  database: string;
  authType: AuthType;
  username: string;
  savePassword: SavePassword;
  encrypt: boolean;
  trustServerCertificate: boolean;
  connectTimeoutSeconds: number;
  queryTimeoutSeconds: number;
  applicationName: string;
  readonly: boolean;
  url: string;
  ssh: SshConfig;
  schemas: string[];
  hideSystemDatabases: boolean;
  advanced: AdvancedProperty[];
  startupSql?: string;
  autoCommit?: boolean;
  defaultSchema?: string;
  poolSize?: number;
  caCertificatePath?: string;
  language?: string;
  dateFormat?: string;
}

export interface ConnectionRequest {
  profile: ConnectionProfile;
  password?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  durationMs: number;
  serverVersion: string;
  serverName: string;
  message: string;
}

export interface SqlInstanceInfo {
  name: string;
  port: number;
}

export const createConnection = (index = 1): ConnectionProfile => ({
  id: crypto.randomUUID(),
  name: index === 1 ? "@localhost" : `@localhost ${index}`,
  description: "",
  color: "#3b82f6",
  environment: "development",
  host: "localhost",
  port: 1433,
  instance: "",
  database: "",
  authType: "integrated",
  username: "",
  savePassword: "never",
  encrypt: true,
  trustServerCertificate: true,
  connectTimeoutSeconds: 10,
  queryTimeoutSeconds: 30,
  applicationName: "SqlStudio",
  readonly: false,
  url: "sqlserver://localhost:1433",
  ssh: { enabled: false, host: "", port: 22, username: "", authMethod: "password", privateKeyPath: "" },
  schemas: [],
  hideSystemDatabases: true,
  advanced: [],
  startupSql: "",
  autoCommit: true,
  defaultSchema: "dbo",
  poolSize: 5,
  caCertificatePath: "",
  language: "",
  dateFormat: "",
});
