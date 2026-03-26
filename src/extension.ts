import * as vscode from "vscode";
import * as prettier from "prettier";
import prettierPluginPhp from "@prettier/plugin-php";

export function activate(context: vscode.ExtensionContext) {
  console.log("Blade Schema Formatter is now active!");

  // Register a formatter specifically for Blade files
  const provider = vscode.languages.registerDocumentFormattingEditProvider(
    "blade",
    {
      async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
      ): Promise<vscode.TextEdit[]> {
        const text = document.getText();
        const edits: vscode.TextEdit[] = [];

        // A basic regex to find @schema([...])
        // Note: For massive nested files, a character-stepping bracket matcher is safer,
        // but regex works well for standard layouts.
        const schemaRegex = /@schema\s*\(\s*(\[[\s\S]*?\])\s*\)/g;
        let match;

        while ((match = schemaRegex.exec(text)) !== null) {
          const fullMatch = match[0];
          const arrayContent = match[1]; // The raw array string

          try {
            // We wrap the array in a dummy PHP tag so Prettier's PHP engine can parse it
            const phpCode = `<?php\n$temp = ${arrayContent};`;

            // Run it through Prettier with strict rules to force expansion
            const formattedPhp = await prettier.format(phpCode, {
              parser: "php",
              plugins: [prettierPluginPhp],
              tabWidth: 4,
              printWidth: 30, // Extremely low print width FORCES nested arrays to break into new lines
              trailingComma: "all",
            });

            // Clean up the dummy wrapper
            let cleanArray = formattedPhp
              .replace("<?php\n$temp = ", "")
              .replace(/;\s*$/, "") // Remove trailing semicolon
              .trim();

            // Create the final text to insert back into the Blade file
            const finalReplacement = `@schema(${cleanArray})`;

            // Add the edit to the VS Code queue
            const startPos = document.positionAt(match.index);
            const endPos = document.positionAt(match.index + fullMatch.length);
            edits.push(
              vscode.TextEdit.replace(
                new vscode.Range(startPos, endPos),
                finalReplacement,
              ),
            );
          } catch (error) {
            console.error("Failed to format @schema block:", error);
            // If formatting fails (e.g., syntax error in the array), we just skip it
          }
        }

        return edits;
      },
    },
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
