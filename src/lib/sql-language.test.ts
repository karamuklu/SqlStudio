import { describe, expect, it } from "vitest";
import { automaticTableAlias, extractTableAliases } from "./sql-language";

describe("automatic SQL aliases", () => {
  it("uses the first letter of a table", () => {
    expect(automaticTableAlias("SELECT * FROM Orders ")).toBe("O");
    expect(automaticTableAlias("LEFT JOIN dbo.TBLSTHAR ")).toBe("T");
    expect(automaticTableAlias("JOIN [dbo].[STOK_HAREKET] ")).toBe("S");
  });

  it("does not replace an existing alias", () => {
    expect(automaticTableAlias("SELECT * FROM Orders O ")).toBeNull();
  });

  it("maps aliases to their source tables", () => {
    const aliases = extractTableAliases("FROM TBLSTSABIT S LEFT JOIN dbo.TBLSTHAR AS H ON H.STOK_KODU = S.STOK_KODU");
    expect(aliases.get("S")).toBe("TBLSTSABIT");
    expect(aliases.get("H")).toBe("TBLSTHAR");
  });
});
