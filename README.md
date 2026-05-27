# kotibudjetti

Small browser-based calculators for personal finance topics.

Current calculators:

- `Osakkeet` - IPO calculator.
- `Kaukolämpö` - District heating pricing calculator, for detecting when provider exceeds price increase guidelines set
  by the KKV

Use the application at https://mikko-apo.github.io/kotibudjetti/

## Security and disclaimer

- This application is open source and free to use.
- The developer takes no responsibility of any kind for whether the application is secure, error-free, or free to use.
- The application is intended as a practical helper, not professional advice.
- The `Osakkeet` calculator works only in the browser and does not send your data anywhere.
- Data that you place into URLs may be visible to others.

If you notice bugs or have improvement ideas, create a simple reproducible test case and file an issue:

- https://github.com/mikko-apo/kotibudjetti/issues

## Development setup

`kotibudjetti` currently depends on `ki-frame` as a sibling checkout. Ki-frame is not published to npm yet.

Expected directory layout:

```text
projects/
  ki-frame/
  kotibudjetti/
```

Example setup:

```bash
cd projects
git clone https://github.com/mikko-apo/ki-frame.git
git clone https://github.com/mikko-apo/kotibudjetti.git
```

Install dependencies:

```bash
(cd ki-frame && npm install)

(cd kotibudjetti && npm install)
```

Useful commands in `kotibudjetti`:

```bash
npm run typecheck
npm run test
npm run bundle
```

The browser bundle is written to:

```text
docs/kotibudjetti.js
```

The docs/kotibudjetti.js is expected to up to date with the PR

GitHub is used to serve the application at https://mikko-apo.github.io/kotibudjetti/

## Development notes

- `tsconfig.json` includes `../ki-frame`, so the sibling checkout must exist for typechecking.
- The app is built as a browser bundle from `src/kotibudjetti.ts`.

## Pull requests

- Changes must include enough unit tests for the behavior they introduce or modify.
- Human verification is required for user-facing changes, calculations, and printed output.
- AI-generated PRs must include enough unit tests and human verification to ensure that the change is correct.
