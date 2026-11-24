# SqlStudio

SqlStudio is a Windows-first SQL Server desktop client. It combines the approved SSMS-inspired shell with a native SQL Server connection manager. Query execution, live Object Explorer discovery and automatic updates remain later phases.

## Phase 1

- Tauri 2 desktop shell with React, TypeScript, and Vite
- Tailwind CSS tokens and small shadcn-style UI primitives
- Monaco SQL editor populated with mock T-SQL
- TanStack Table mock results with sorting and column filters
- Zustand UI state for theme, active tabs, and panel sizes
- Resizable Object Explorer and results panels
- Dark and light themes
- GitHub Actions checks and Windows Tauri build

## Connection manager

- DataGrip-inspired, theme-aware connection editor with General, Options, SSH/SSL, Schemas and Advanced tabs
- Windows and SQL Server authentication through native Rust commands and `tiberius`
- Connection test, SQL Browser instance discovery and database listing
- Profiles in the Tauri application-data directory; passwords only in the operating-system keychain
- Native and JDBC SQL Server URL import/parsing, validation, password-free JSON import/export
- SSH settings are persisted in the UI model, but tunnelling is deliberately rejected with a clear error until the tunnel transport is implemented

## Architecture

```text
src/
  components/
    layout/       Desktop shell and resize behavior
    connections/  Connection list, editor tabs and dialog orchestration
    object-tree/  Phase 1 static Object Explorer
    query/        Monaco editor and query tabs
    results/      TanStack mock result grid
    ui/           Reusable shadcn-style primitives
  data/           Mock SQL, tree, and result rows
  lib/            Shared helpers and typed Tauri connection client
  store/          Zustand presentation state
src-tauri/        Tauri host, profile/keychain services and tiberius connection commands
```

The front end owns presentation state. Credentials and network access stay behind narrow Tauri commands; the webview never writes passwords to profile JSON.

## Development

Prerequisites: Node.js 22+, Rust stable, and the Tauri 2 Windows prerequisites.

```bash
npm ci
npm run dev
npm run check
npm run tauri dev
```

## Branches and releases

- `main`: protected, releasable code
- `dev`: optional integration branch for multi-feature work
- `feature/*`: focused pull requests using Conventional Commits

Semantic Versioning is used. Pushing a `v*` tag starts the Windows release workflow, which builds the installer, signs the updater payload and publishes `latest.json` with the GitHub Release. The updater private key and optional Windows code-signing certificate stay in GitHub Actions secrets; only the updater public key is embedded in the app. The toolbar shows the installed version and can check, download, install and restart into a newer release. For private repositories, release downloads should be served through an authenticated update service rather than embedding a GitHub token in the desktop client.

## Phase boundaries

The connection-manager slice and signed Windows updater flow are functional. Later work adds query execution/cancellation, live Object Explorer loading, IntelliSense, result exports and session persistence.

## License

MIT. See [LICENSE](LICENSE).
