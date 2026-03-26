# Blade Schema Formatter

A precision formatting tool for VS Code, designed specifically to handle massive, nested PHP arrays inside custom Laravel Blade directives.

## The Problem

Standard Blade formatters treat custom directives like `@schema(...)` as a single string expression. When passing large configuration arrays, formatters either ignore them entirely or aggressively squash them into a single, unreadable line.

## The Solution

This extension acts as a targeted formatting sniper. It uses a custom bracket-balancing algorithm to safely extract the array from your `@schema` block, passes it through Prettier's internal PHP engine with a strict line-width to force expansion, and safely injects the perfectly indented array back into your Blade file.

## Features

- **Targeted Formatting:** Only touches `@schema` blocks, leaving your HTML and Tailwind classes to your primary formatter.
- **Deep Expansion:** Forces nested arrays (`settings`, `options`, `blocks`) onto multiple lines for maximum readability.
- **Parentheses Safe:** Uses bracket-counting instead of simple Regex, meaning text strings like `'label' => 'Standard (Glow)'` won't break the parser.

## Usage

Because this is a targeted tool, you should not set it as your default Blade formatter. Instead, use it on-demand when working with your schema arrays:

1. Open your `.blade.php` file.
2. Right-click anywhere in the editor.
3. Select **Format Document With...**
4. Choose **Blade Schema Formatter** from the dropdown menu.

## Requirements

- VS Code 1.105.0 or higher.
