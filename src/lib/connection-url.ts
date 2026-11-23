import type { ConnectionProfile } from "../types/connections";

export function buildConnectionUrl(profile: Pick<ConnectionProfile, "host" | "port" | "instance" | "database">) {
  const host = profile.host.trim() || "localhost";
  const port = profile.port || 1433;
  const parameters = [
    profile.instance && `instance=${encodeURIComponent(profile.instance)}`,
    profile.database && `database=${encodeURIComponent(profile.database)}`,
  ].filter(Boolean);
  return `sqlserver://${host}:${port}${parameters.length ? `;${parameters.join(";")}` : ""}`;
}

export function parseConnectionUrl(value: string) {
  const normalized = value.trim().replace(/^jdbc:/i, "");
  const match = normalized.match(/^sqlserver:\/\/([^;:/]+)(?::(\d+))?(.*)$/i);
  if (!match) return null;
  const [, host, portText, tail] = match;
  const properties = Object.fromEntries(
    tail
      .replace(/^;/, "")
      .split(";")
      .filter(Boolean)
      .map((item) => {
        const [key, ...rest] = item.split("=");
        return [key.toLowerCase(), decodeURIComponent(rest.join("="))];
      }),
  );
  return {
    host,
    port: portText ? Number(portText) : 1433,
    instance: properties.instance ?? properties.instancename ?? "",
    database: properties.database ?? properties.databasename ?? "",
  };
}

export function validateConnection(profile: ConnectionProfile, profiles: ConnectionProfile[]) {
  const errors: Record<string, string> = {};
  if (!profile.name.trim()) errors.name = "Bağlantı adı zorunludur.";
  if (profiles.some((item) => item.id !== profile.id && item.name.trim().toLocaleLowerCase("tr") === profile.name.trim().toLocaleLowerCase("tr"))) {
    errors.name = "Bağlantı adı benzersiz olmalıdır.";
  }
  if (!profile.host.trim()) errors.host = "Sunucu alanı boş olamaz.";
  if (!Number.isInteger(profile.port) || profile.port < 1 || profile.port > 65535) errors.port = "Port 1 ile 65535 arasında olmalıdır.";
  if ((profile.authType === "sqlServer" || profile.authType === "azureAdPassword") && !profile.username.trim()) errors.username = "Kullanıcı adı zorunludur.";
  return errors;
}
