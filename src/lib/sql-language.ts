import type { Monaco } from "@monaco-editor/react";

export interface SqlObjectMetadata {
  name: string;
  columns: string[];
}

export const sqlObjects: SqlObjectMetadata[] = [
  { name: "TBLSTSABIT", columns: ["STOK_KODU", "STOK_ADI", "GRUP_KODU"] },
  { name: "TBLSTHAR", columns: ["STOK_KODU", "DEPO_KODU", "MIKTAR", "TARIH"] },
  { name: "VW_STOK_BAKIYE", columns: ["STOK_KODU", "STOK_ADI", "GRUP_KODU", "BAKIYE", "SON_HAREKET"] },
];

const sqlKeywords = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN",
  "ON", "AS", "GROUP BY", "ORDER BY", "HAVING", "TOP", "DISTINCT", "INSERT INTO", "UPDATE",
  "DELETE", "VALUES", "SET", "AND", "OR", "NOT", "NULL", "IS NULL", "IS NOT NULL", "CASE",
  "WHEN", "THEN", "ELSE", "END", "WITH", "UNION ALL", "EXEC", "BEGIN", "COMMIT", "ROLLBACK",
];

const reservedAliases = new Set(sqlKeywords.flatMap((keyword) => keyword.split(" ")));
const identifier = String.raw`(?:\[[^\]]+\]|[A-Za-z_#][\w$#]*)(?:\s*\.\s*(?:\[[^\]]+\]|[A-Za-z_#][\w$#]*))*`;

export function automaticTableAlias(lineBeforeCursor: string): string | null {
  const match = lineBeforeCursor.match(new RegExp(String.raw`\b(?:FROM|JOIN|UPDATE|INTO)\s+(${identifier})\s+$`, "i"));
  if (!match) return null;
  const tableName = match[1].split(".").at(-1)?.replaceAll("[", "").replaceAll("]", "").replace(/\s/g, "") ?? "";
  const firstLetter = tableName.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/u)?.[0];
  return firstLetter?.toLocaleUpperCase("tr") ?? null;
}

export function extractTableAliases(sql: string) {
  const aliases = new Map<string, string>();
  const expression = new RegExp(String.raw`\b(?:FROM|JOIN|UPDATE|INTO)\s+(${identifier})(?:\s+(?:AS\s+)?([A-Za-z_#][\w$#]*))?`, "gi");
  for (const match of sql.matchAll(expression)) {
    const tableName = match[1].split(".").at(-1)?.replaceAll("[", "").replaceAll("]", "").replace(/\s/g, "") ?? "";
    const candidate = match[2]?.toLocaleUpperCase("en-US");
    if (candidate && !reservedAliases.has(candidate)) aliases.set(candidate, tableName.toLocaleUpperCase("en-US"));
  }
  return aliases;
}

export function registerSqlCompletionProvider(monaco: Monaco) {
  return monaco.languages.registerCompletionItemProvider("sql", {
    triggerCharacters: [".", " "],
    provideCompletionItems(model, position) {
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      const aliasAccess = textBeforeCursor.match(/([A-Za-z_#][\w$#]*)\.([A-Za-z_#\w$]*)$/);
      if (aliasAccess) {
        const tableName = extractTableAliases(model.getValue()).get(aliasAccess[1].toLocaleUpperCase("en-US"));
        const table = sqlObjects.find((item) => item.name === tableName);
        return {
          suggestions: (table?.columns ?? []).map((column) => ({
            label: column,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: column,
            detail: table ? `${table.name} sütunu` : "Sütun",
            range,
          })),
        };
      }

      const expectsObject = /\b(?:FROM|JOIN|UPDATE|INTO)\s+(?:\[[^]]*]|[\w.$#])*$/i.test(textBeforeCursor);
      const tableSuggestions = sqlObjects.map((table) => ({
        label: table.name,
        kind: monaco.languages.CompletionItemKind.Struct,
        insertText: table.name,
        detail: "SQL nesnesi",
        range,
      }));
      if (expectsObject) return { suggestions: tableSuggestions };

      const keywordSuggestions = sqlKeywords.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      }));
      return {
        suggestions: [
          ...keywordSuggestions,
          ...tableSuggestions,
          {
            label: "SELECT TOP 100",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "SELECT TOP 100\n    ${1:*}\nFROM ${2:TABLE_NAME}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Sorgu şablonu",
            range,
          },
        ],
      };
    },
  });
}
