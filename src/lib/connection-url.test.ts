import { describe, expect, it } from "vitest";
import { buildConnectionUrl, parseConnectionUrl, validateConnection } from "./connection-url";
import { createConnection } from "../types/connections";

describe("connection URL", () => {
  it("builds and parses the native SQL Server format", () => {
    const source = { ...createConnection(), host: "db01", port: 1444, instance: "NETSIS", database: "CARI" };
    const url = buildConnectionUrl(source);
    expect(url).toBe("sqlserver://db01:1444;instance=NETSIS;database=CARI");
    expect(parseConnectionUrl(url)).toEqual({ host: "db01", port: 1444, instance: "NETSIS", database: "CARI" });
  });

  it("imports JDBC SQL Server addresses", () => {
    expect(parseConnectionUrl("jdbc:sqlserver://localhost;databaseName=master")).toEqual({ host: "localhost", port: 1433, instance: "", database: "master" });
  });
});

describe("connection validation", () => {
  it("rejects duplicate names and invalid ports", () => {
    const existing = createConnection();
    const candidate = { ...createConnection(2), name: existing.name, port: 70000 };
    expect(validateConnection(candidate, [existing, candidate])).toMatchObject({ name: expect.any(String), port: expect.any(String) });
  });
});
