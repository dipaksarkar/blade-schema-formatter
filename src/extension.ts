import * as vscode from "vscode";
import * as prettier from "prettier";
import prettierPluginPhp from "@prettier/plugin-php";

export function activate(context: vscode.ExtensionContext) {
  console.log("Blade Schema Formatter (Save Hook) is now active!");

  // Listen for the moment BEFORE a document is saved
  const saveListener = vscode.workspace.onWillSaveTextDocument((event) => {
    // Only run on Blade files
    if (event.document.languageId === "blade") {
      // waitUntil tells VS Code to pause the save until our edits are applied
      const promise = formatSchemaBlocks(event.document);
      event.waitUntil(promise);
    }
  });

  context.subscriptions.push(saveListener);
}

async function formatSchemaBlocks(
  document: vscode.TextDocument,
): Promise<vscode.TextEdit[]> {
  const text = document.getText();
  const edits: vscode.TextEdit[] = [];

  const schemaStartRegex = /@schema\s*\(\s*\[/g;
  let match;

  while ((match = schemaStartRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const arrayStartIndex = text.indexOf("[", startIndex);

    let bracketCount = 0;
    let arrayEndIndex = -1;

    for (let i = arrayStartIndex; i < text.length; i++) {
      if (text[i] === "[") bracketCount++;
      if (text[i] === "]") bracketCount--;

      if (bracketCount === 0) {
        arrayEndIndex = i;
        break;
      }
    }

    if (arrayEndIndex !== -1) {
      const arrayContent = text.substring(arrayStartIndex, arrayEndIndex + 1);
      const fullMatchEndIndex = text.indexOf(")", arrayEndIndex) + 1;

      try {
        const phpCode = `<?php\n$temp = ${arrayContent};`;

        const formattedPhp = await prettier.format(phpCode, {
          parser: "php",
          plugins: [prettierPluginPhp],
          tabWidth: 4,
          printWidth: 30, // Forces expansion
          trailingComma: "all",
        });

        let cleanArray = formattedPhp
          .replace("<?php\n$temp = ", "")
          .replace(/;\s*$/, "")
          .trim();

        const finalReplacement = `@schema(${cleanArray})`;

        const startPos = document.positionAt(startIndex);
        const endPos = document.positionAt(fullMatchEndIndex);

        edits.push(
          vscode.TextEdit.replace(
            new vscode.Range(startPos, endPos),
            finalReplacement,
          ),
        );
      } catch (error) {
        console.error("Failed to format @schema block:", error);
      }
    }
  }

  return edits;
}

export function deactivate() {}
