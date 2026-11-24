import Editor, { type BeforeMount } from "@monaco-editor/react";
import { useStudioStore } from "../../store/studio-store";

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
};

export function QueryEditor() {
  const theme = useStudioStore((state) => state.theme);
  const activeTabId = useStudioStore((state) => state.activeQueryTab);
  const activeTab = useStudioStore((state) => state.queryTabs.find((tab) => tab.id === state.activeQueryTab));
  const updateQueryContent = useStudioStore((state) => state.updateQueryContent);

  return (
    <section className="min-h-0 bg-background">
      <Editor
        beforeMount={configureMonaco}
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
        }}
      />
    </section>
  );
}
