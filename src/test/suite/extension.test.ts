import "mocha";
import * as assert from "assert";
import * as vscode from "vscode";

suite("Blade Schema Formatter", function () {
  // Allow extra time for extension activation and formatting
  this.timeout(10000);

  setup(async () => {
    // Activate the extension so the command and save hook are registered.
    const ext = vscode.extensions.getExtension(
      "dipaksarkar.blade-schema-formatter",
    );
    if (ext) {
      await ext.activate();
    }
  });

  test("formats @schema blocks when the command is executed", async () => {
    const unformatted = `@schema([
    'name' => 'Footer',
    'settings' => [
        ['id' => 'style', 'type' => 'select', 'label' => 'Footer style', 'default' => 'default', 'options' => [['value' => 'saas', 'label' => 'SaaS — Logo · 4 columns · bottom bar'], ['value' => 'default', 'label' => 'Default — 4-column grid']]],
        ['id' => 'show_language_selector', 'type' => 'checkbox', 'label' => 'Show language selector', 'default' => true]
    ]
])`;

    const expected = `@schema([
    'name' => 'Footer',
    'settings' => [
        [
            'id' => 'style',
            'type' => 'select',
            'label' => 'Footer style',
            'default' => 'default',
            'options' => [
                [
                    'value' => 'saas',
                    'label' => 'SaaS — Logo · 4 columns · bottom bar',
                ],
                ['value' => 'default', 'label' => 'Default — 4-column grid'],
            ],
        ],
        [
            'id' => 'show_language_selector',
            'type' => 'checkbox',
            'label' => 'Show language selector',
            'default' => true,
        ],
    ],
])`;

    // Create a virtual text document with language 'blade' and the unformatted content.
    const doc = await vscode.workspace.openTextDocument({
      language: "blade",
      content: unformatted,
    });
    await vscode.window.showTextDocument(doc);

    // Execute the extension command that formats @schema blocks.
    await vscode.commands.executeCommand("blade-schema-formatter.formatSchema");

    // After the command, the document text should be updated in-place.
    const actual = doc.getText();
    const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
    assert.strictEqual(normalize(actual), normalize(expected));
  });
});
