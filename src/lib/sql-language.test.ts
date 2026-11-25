import { describe, expect, it } from "vitest";
import { automaticTableAlias, definitionTargetAtOffset, extractTableAliases } from "./sql-language";

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

describe("definitionTargetAtOffset", () => {
  it("finds a stored procedure after EXEC", () => {
    const sql = "EXEC dbo.SUSKONCESI_HAZIRLIK_MKA";
    expect(definitionTargetAtOffset(sql, sql.length)).toBe("dbo.SUSKONCESI_HAZIRLIK_MKA");
  });

  it("finds a bracketed object under the cursor", () => {
    const sql = "SELECT * FROM [dbo].[Orders]";
    expect(definitionTargetAtOffset(sql, sql.length)).toBe("dbo.Orders");
  });
});
