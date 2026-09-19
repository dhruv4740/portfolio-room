# Phone app presentation

The phone stage is a browser presentation of the portfolio projects' Android
workflows. It keeps the original product names, screen hierarchy, copy, color
tokens, and interaction paths while using local React components so the
portfolio can run without an Android runtime or a backend.

- **FocusLock** follows the source Android layout, strings, and colors from the
  `focuslock` project. The header labels it as a browser demo.
- **Expense Tracker** follows the React Native screen structure and uses
  clearly marked sample fixture data.
- **BasketProof** follows the Kotlin Compose screen structure and uses sample
  evidence data, including its UNKNOWN-versus-WRONG rule.

These reconstructions do not auto-sync when the original projects change.
Future source updates require an intentional parity pass or a generated build;
the portfolio currently ships the reviewed snapshot in this folder.
