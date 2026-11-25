import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import { automaticTableAlias, registerSqlCompletionProvider } from "../../lib/sql-language";
import { useStudioStore } from "../../store/studio-store";

let sqlLanguageConfigured = false;

const configureMonaco: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("sqlstudio-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword.sql", foreground: "8B5CF6", fontStyle: "bold" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "string.sql", foreground: "7DD3FC" },
      { token: "number", foreground: "F59E0B" },
    ],
    colors: {
      "editor.background": "#141922",
      "editorLineNumber.foreground": "#61708a",
      "editorLineNumber.activeForeground": "#dbeafe",
      "editor.selectionBackground": "#315d9e66",
      "editorIndentGuide.background1": "#273041",
      "minimap.background": "#141922",
    },
  });
  monaco.editor.defineTheme("sqlstudio-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword.sql", foreground: "6D28D9", fontStyle: "bold" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "string.sql", foreground: "0369A1" },
    ],
    colors: { "editor.background": "#F8FAFC", "minimap.background": "#F8FAFC" },
  });
  if (!sqlLanguageConfigured) {
    registerSqlCompletionProvider(monaco);
    sqlLanguageConfigured = true;
  }
};

export function QueryEditor() {
  const theme = useStudioStore((state) => state.theme);
  const activeTabId = useStudioStore((state) => state.activeQueryTab);
  const activeTab = useStudioStore((state) => state.queryTabs.find((tab) => tab.id === state.activeQueryTab));
  const updateQueryContent = useStudioStore((state) => state.updateQueryContent);
  const handleMount: OnMount = (editor, monaco) => {
    let applyingAlias = false;
    editor.onDidChangeModelContent((event) => {
      if (applyingAlias || event.changes.length !== 1 || event.changes[0].text !== " ") return;
      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;
      const lineBeforeCursor = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const alias = automaticTableAlias(lineBeforeCursor);
      if (!alias) return;
      applyingAlias = true;
      editor.executeEdits("automatic-table-alias", [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: `${alias} `,
        forceMoveMarkers: true,
      }]);
      editor.setPosition({ lineNumber: position.lineNumber, column: position.column + alias.length + 1 });
      applyingAlias = false;
    });
  };

  return (
    <section className="min-h-0 bg-background">
      <Editor
        beforeMount={configureMonaco}
        onMount={handleMount}
        defaultLanguage="sql"
        value={activeTab?.content ?? ""}
        onChange={(value) => { if (activeTabId) updateQueryContent(activeTabId, value ?? ""); }}
        path={activeTabId || "empty-query"}
        theme={theme === "dark" ? "sqlstudio-dark" : "sqlstudio-light"}
        options={{
          automaticLayout: true,
          readOnly: !activeTab,
          fontFamily: "Cascadia Code, Consolas, monospace",
          fontSize: 13,
          lineHeight: 20,
          minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
          padding: { top: 10 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          folding: true,
          wordWrap: "off",
          renderLineHighlight: "none",
          overviewRulerBorder: false,
          quickSuggestions: { other: true, comments: false, strings: false },
          suggestOnTriggerCharacters: true,
          tabCompletion: "on",
        }}
      />
    </section>
  );
}
