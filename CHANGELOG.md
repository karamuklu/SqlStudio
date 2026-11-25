# Changelog

All notable changes to this project will be documented here. The project follows Semantic Versioning.

## [Unreleased]

## [0.2.4] - 2026-11-25

### Added

- Ctrl+B opens the live SQL definition for procedures, functions, views and triggers
- IntelliSense now suggests live tables, views, procedures, functions and alias columns from the active database

### Fixed

- Object Explorer no longer times out by eagerly loading every column in large databases
- Table and view details are loaded only when expanded, with visible retry errors

## [0.2.3] - 2026-11-25

### Added

- Object Explorer now lists every database available on the connected SQL Server
- Tables expose Columns, Keys, Indexes and Triggers as expandable child groups
- Views expose their Columns as an expandable child group

### Changed

- Object Explorer category and child labels are now consistently English
- Changing the active query database from the toolbar opens and loads that database in Object Explorer
- Database metadata is loaded lazily and cached independently for responsive servers with many databases

## [0.2.2] - 2026-11-25

### Added

- Live Object Explorer for tables, views, stored procedures and functions
- Real SQL query execution from the editor with F5 and dynamic result columns
- Query progress, timing, messages and a 100,000-row safety limit

### Fixed

- Selected connection now remains the active session after closing the connection dialog
- Database selection now refreshes the Object Explorer instead of showing prototype data
- The Run button now executes the current editor contents against the selected database

## [0.2.0] - 2026-11-24

### Added

- Native SQL Server connection profiles, testing, database discovery and OS keychain storage
- Signed in-app updates backed by GitHub Releases

### Fixed

- Named SQL Server instance parsing for `SUNUCU\\INSTANCE`
- Console window appearing beside the Windows desktop application
- Mock query tabs and sample SQL appearing at startup

## [0.1.0] - 2026-11-23

### Added

- Phase 1 Tauri and React application shell
- Prototype-faithful light and dark themes
- Mock Monaco editor and TanStack result grid
- Resizable Object Explorer and result panels
- Initial CI and Windows desktop build workflow
