import { useEffect } from "react";
import { DesktopShell } from "./components/layout/DesktopShell";
import { useStudioStore } from "./store/studio-store";

export function App() {
  const theme = useStudioStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return <DesktopShell />;
}
