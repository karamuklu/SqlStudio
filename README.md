# SqlStudio

SqlStudio is a Windows-first SQL Server desktop client. Phase 1 delivers the approved application shell only: a faithful SSMS-inspired layout, mock editor and result data, themes, resizing, and build automation. Database connectivity, query execution, schema discovery, credential storage, and automatic updates intentionally remain outside this phase.

## Phase 1

- Tauri 2 desktop shell with React, TypeScript, and Vite
- Tailwind CSS tokens and small shadcn-style UI primitives
- Monaco SQL editor populated with mock T-SQL
- TanStack Table mock results with sorting and column filters
- Zustand UI state for theme, active tabs, and panel sizes
- Resizable Object Explorer and results panels
- Dark and light themes
- GitHub Actions checks and Windows Tauri build

## Architecture

```text
src/
  components/
    layout/       Desktop shell and resize behavior
    object-tree/  Phase 1 static Object Explorer
    query/        Monaco editor and query tabs
    results/      TanStack mock result grid
    ui/           Reusable shadcn-style primitives
  data/           Mock SQL, tree, and result rows
  lib/            Shared helpers
  store/          Zustand presentation state
src-tauri/        Minimal Tauri 2 host (no SQL commands yet)
```

The front end owns presentation state and mock interactions. Future native capabilities will be exposed as narrow Tauri commands instead of allowing direct database access from the webview.

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

Semantic Versioning is used. A future release phase should use Release Please to prepare version/changelog pull requests, followed by a signed `v*` tag workflow that builds NSIS/MSI artifacts and Tauri updater metadata. The updater private key and optional Windows signing certificate stay in GitHub Actions secrets; only the updater public key is embedded in the app. For private repositories, release downloads should be served through an authenticated update service rather than embedding a GitHub token in the desktop client.

## Phase boundaries

Phase 2 and later will add the real SQL Server connection layer, OS keychain integration, query execution/cancellation, schema loading, IntelliSense, exports, session persistence, signed releases, and updater behavior. None of those controls claim to be functional in Phase 1.

## License

MIT. See [LICENSE](LICENSE).
