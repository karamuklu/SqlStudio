import type { Monaco } from "@monaco-editor/react";

export interface SqlObjectMetadata {
  schema: string;
  name: string;
  kind: "table" | "view" | "procedure" | "function";
  columns?: string[];
}

type MetadataResolver = () => SqlObjectMetadata[];
type ColumnResolver = (object: SqlObjectMetadata) => Promise<string[]>;

let metadataResolver: MetadataResolver = () => [];
let columnResolver: ColumnResolver = async (object) => object.columns ?? [];

export function configureSqlMetadata(resolveMetadata: MetadataResolver, resolveColumns: ColumnResolver) {
  metadataResolver = resolveMetadata;
  columnResolver = resolveColumns;
}

const sqlKeywords = [
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN",
  "ON", "AS", "GROUP BY", "ORDER BY", "HAVING", "TOP", "DISTINCT", "INSERT INTO", "UPDATE",
  "DELETE", "VALUES", "SET", "AND", "OR", "NOT", "NULL", "IS NULL", "IS NOT NULL", "CASE",
  "WHEN", "THEN", "ELSE", "END", "WITH", "UNION ALL", "EXEC", "BEGIN", "COMMIT", "ROLLBACK",
];

const reservedAliases = new Set(sqlKeywords.flatMap((keyword) => keyword.split(" ")));
const identifier = String.raw`(?:\[[^\]]+\]|[A-Za-z_#][\w$#]*)(?:\s*\.\s*(?:\[[^\]]+\]|[A-Za-z_#][\w$#]*))*`;

const cleanIdentifier = (value: string) => value.replaceAll("[", "").replaceAll("]", "").replace(/\s/g, "");

export function automaticTableAlias(lineBeforeCursor: string): string | null {
  const match = lineBeforeCursor.match(new RegExp(String.raw`\b(?:FROM|JOIN|UPDATE|INTO)\s+(${identifier})\s+$`, "i"));
  if (!match) return null;
  const tableName = cleanIdentifier(match[1]).split(".").at(-1) ?? "";
  const firstLetter = tableName.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/u)?.[0];
  return firstLetter?.toLocaleUpperCase("tr") ?? null;
}

export function extractTableAliases(sql: string) {
  const aliases = new Map<string, string>();
  const expression = new RegExp(String.raw`\b(?:FROM|JOIN|UPDATE|INTO)\s+(${identifier})(?:\s+(?:AS\s+)?([A-Za-z_#][\w$#]*))?`, "gi");
  for (const match of sql.matchAll(expression)) {
    const tableName = cleanIdentifier(match[1]).split(".").at(-1) ?? "";
    const candidate = match[2]?.toLocaleUpperCase("en-US");
    if (candidate && !reservedAliases.has(candidate)) aliases.set(candidate, tableName.toLocaleUpperCase("en-US"));
  }
  return aliases;
}

function findReferencedObject(sql: string, alias: string, objects: SqlObjectMetadata[]) {
  const tableName = extractTableAliases(sql).get(alias.toLocaleUpperCase("en-US"));
  if (!tableName) return undefined;
  return objects.find((object) => (object.kind === "table" || object.kind === "view") && object.name.toLocaleUpperCase("en-US") === tableName);
}

export function definitionTargetAtOffset(sql: string, offset: number): string | null {
  const boundedOffset = Math.max(0, Math.min(offset, sql.length));
  const lineStart = sql.lastIndexOf("\n", boundedOffset - 1) + 1;
  const lineEndIndex = sql.indexOf("\n", boundedOffset);
  const lineEnd = lineEndIndex === -1 ? sql.length : lineEndIndex;
  const line = sql.slice(lineStart, lineEnd);
  const column = boundedOffset - lineStart;
  const beforeCursor = line.slice(0, column);
  const execMatch = beforeCursor.match(new RegExp(String.raw`\bEXEC(?:UTE)?\s+(${identifier})\s*(?:[^\n]*)$`, "i"));
  if (execMatch) return cleanIdentifier(execMatch[1]);

  let start = column;
  let end = column;
  while (start > 0 && /[\w$#.[\]]/.test(line[start - 1])) start -= 1;
  while (end < line.length && /[\w$#.[\]]/.test(line[end])) end += 1;
  const candidate = cleanIdentifier(line.slice(start, end));
  return candidate && /[A-Za-z_#]/.test(candidate) ? candidate : null;
}

export function registerSqlCompletionProvider(monaco: Monaco) {
  return monaco.languages.registerCompletionItemProvider("sql", {
    triggerCharacters: [".", " "],
    async provideCompletionItems(model, position) {
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
      const objects = metadataResolver();
      const aliasAccess = textBeforeCursor.match(/([A-Za-z_#][\w$#]*)\.([A-Za-z_#\w$]*)$/);
      if (aliasAccess) {
        const object = findReferencedObject(model.getValue(), aliasAccess[1], objects);
        const columns = object ? (object.columns?.length ? object.columns : await columnResolver(object)) : [];
        return {
          suggestions: columns.map((column) => ({
            label: column,
            kind: monaco.languages.CompletionItemKind.Field,
            insertText: column,
            detail: object ? `${object.schema}.${object.name} column` : "Column",
            range,
          })),
        };
      }

      const expectsExecutable = /\bEXEC(?:UTE)?\s+(?:\[[^]]*]|[\w.$#])*$/i.test(textBeforeCursor);
      const expectsObject = /\b(?:FROM|JOIN|UPDATE|INTO)\s+(?:\[[^]]*]|[\w.$#])*$/i.test(textBeforeCursor);
      const candidateObjects = objects.filter((object) => expectsExecutable
        ? object.kind === "procedure"
        : object.kind === "table" || object.kind === "view" || object.kind === "function");
      const objectSuggestions = candidateObjects.map((object) => ({
        label: `${object.schema}.${object.name}`,
        kind: object.kind === "procedure" || object.kind === "function" ? monaco.languages.CompletionItemKind.Function : monaco.languages.CompletionItemKind.Struct,
        insertText: `${object.schema}.${object.name}`,
        detail: object.kind,
        range,
      }));
      if (expectsObject || expectsExecutable) return { suggestions: objectSuggestions };

      const keywordSuggestions = sqlKeywords.map((keyword) => ({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword,
        range,
      }));
      return {
        suggestions: [
          ...keywordSuggestions,
          ...objectSuggestions,
          {
            label: "SELECT TOP 100",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: "SELECT TOP 100\n    ${1:*}\nFROM ${2:TABLE_NAME}",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "Query template",
            range,
          },
        ],
      };
    },
  });
}
