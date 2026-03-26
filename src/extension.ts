import * as vscode from "vscode";
import * as prettier from "prettier";
import * as prettierPluginPhp from "@prettier/plugin-php";

export function activate(context: vscode.ExtensionContext) {
  console.log("Blade Schema Formatter is active!");

  // 1. MANUAL COMMAND (Cmd + Shift + P)
  let disposableCommand = vscode.commands.registerCommand(
    "blade-schema-formatter.formatSchema",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const edits = await formatSchemaBlocks(editor.document);
      if (edits.length > 0) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(editor.document.uri, edits);
        await vscode.workspace.applyEdit(workspaceEdit);
        vscode.window.showInformationMessage("Schema Formatted!");
      }
    },
  );

  // 2. AUTO-FORMAT ON SAVE HOOK (configurable)
  // Register only if enabled in settings; also listen for config changes.
  let saveHook: vscode.Disposable | undefined;

  const registerSaveHook = () => {
    if (saveHook) {
      saveHook.dispose();
      saveHook = undefined;
    }

    const config = vscode.workspace.getConfiguration("bladeSchemaFormatter");
    const enableOnSave = config.get<boolean>("enableOnSave", true);

    if (enableOnSave) {
      saveHook = vscode.workspace.onWillSaveTextDocument((event) => {
        if (event.document.languageId === "blade") {
          // event.waitUntil pauses the save until our array is formatted
          const promise = formatSchemaBlocks(event.document);
          event.waitUntil(promise);
        }
      });
      context.subscriptions.push(saveHook);
    }
  };

  // Initial registration
  registerSaveHook();

  // Re-register when configuration changes for our extension
  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("bladeSchemaFormatter.enableOnSave")) {
      registerSaveHook();
    }
  });

  context.subscriptions.push(disposableCommand, configWatcher);
}

// The Formatting Engine
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
      if (text[i] === "[") {
        bracketCount++;
      }
      if (text[i] === "]") {
        bracketCount--;
      }

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

        const config = vscode.workspace.getConfiguration(
          "bladeSchemaFormatter",
        );
        const tabWidth = config.get<number>("tabWidth", 4);
        const printWidth = config.get<number>("printWidth", 80);
        const trailingComma = config.get<string>("trailingComma", "all") as
          | "none"
          | "es5"
          | "all";
        const singleQuote = config.get<boolean>("singleQuote", true);

        const formattedPhp = await prettier.format(phpCode, {
          parser: "php",
          plugins: [prettierPluginPhp as any],
          tabWidth,
          printWidth, // <--- configurable print width
          trailingComma: trailingComma as any,
          singleQuote,
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
