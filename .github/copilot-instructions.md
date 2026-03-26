## Purpose

This repo implements a small VS Code extension that formats Blade `@schema([...])` PHP arrays inside Blade templates. The formatter extracts the array, runs it through Prettier (PHP parser + `@prettier/plugin-php`) and replaces the original `@schema(...)` call with the formatted array.

## Big picture (what to know first)

- Key file: `src/extension.ts` — contains the activation, a registered command (`blade-schema-formatter.formatSchema`) and a save hook (`onWillSaveTextDocument`) that formats `languageId === 'blade'` documents.
- The core formatting routine is `formatSchemaBlocks(document)` in `src/extension.ts`. It locates `@schema([` blocks with a regex and performs bracket counting to find the matching `]` and closing `)`.
- Formatting strategy: the extension wraps the extracted array in a tiny PHP snippet (`<?php\n$temp = ${array};`) and calls `prettier.format(..., { parser: 'php', plugins: [@prettier/plugin-php], tabWidth: 4, printWidth: 80, trailingComma: 'all' })`. The cleaned output replaces the original `@schema(...)` expression.

## Project-specific patterns and gotchas

- The code uses a simple regex and manual bracket counting to find array boundaries. It generally handles nested arrays but may fail on complex cases (arrays inside strings or unmatched brackets). Errors are logged (console.error) and the block is skipped.
- Formatting options are hard-coded in `src/extension.ts` (tabWidth: 4, printWidth: 80). If you need to change the style, update those options directly.
- Command ID: `blade-schema-formatter.formatSchema` — used in `package.json` contribute section and registered in `extension.ts`. Use this ID to trigger formatting programmatically in tests or other extensions.
- Save hook triggers only for files where `document.languageId === 'blade'`. Ensure test files or fixtures set that language when simulating saves.

## How to build, test, and iterate locally

- Compile: `yarn run compile` (or `npm run compile`) — runs `tsc -p ./` and produces `out/extension.js` (the runtime entry: `main` in `package.json`).
- Watch: `yarn run watch` — useful during development (typecheck and incremental compile). The workspace has a reusable npm task named `watch` used by the VS Code task runner.
- Lint: `yarn run lint` (uses `eslint src`).
- Tests: `yarn test` — this uses `vscode-test` and runs extension integration tests under `test/`. Tests require the compiled `out/extension.js` artifact, so `compile` runs as part of `pretest`.

## Useful search patterns

- Find formatting logic: search for `formatSchemaBlocks` or `@schema` in `src/extension.ts`.
- Command/activation: search `blade-schema-formatter.formatSchema` in `package.json` and `src/extension.ts`.

## Where to change behavior

- Prettier settings: `src/extension.ts` (the call to `prettier.format`).
- Regex/bracket detection: `schemaStartRegex` and the bracket counting loop in `formatSchemaBlocks`.
- Messages shown to users: `vscode.window.showInformationMessage("Schema Formatted!")` in the registered command flow.

## Integration and dependencies

- Runtime dependencies: `prettier` and `@prettier/plugin-php` (declared in `package.json`). Keep plugin version and Prettier compatible.
- VS Code APIs used: `vscode.commands`, `vscode.workspace.onWillSaveTextDocument`, `vscode.WorkspaceEdit`, `vscode.TextEdit`, `vscode.Range`.
- Tests use the standard `vscode-test` runner; see `test/` for examples of activation + command invocation.

## Quick PR checklist for contributors

1. Run `yarn run compile` and `yarn run lint` locally.
2. Run `yarn test` (integration tests require compiled `out/extension.js`).
3. If you change formatting behavior, include a unit/integration test under `test/` that simulates a Blade document with the `@schema([ ... ])` block and verifies the replacement.
4. Update this instructions file if you change command IDs, activation behavior, or formatting defaults.

## If something is unclear

Tell me which part of the formatting flow or developer command you'd like expanded (regex details, failing edge-cases, or test setup) and I will iterate on this file.
