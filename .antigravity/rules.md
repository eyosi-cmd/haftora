# Haftora Project Rules & Guidelines

## Learned Rules & Invariants

### 1. SSL Interception Handling & CLI Bypass
- **Environment Context**: Corporate/enterprise SSL inspection intercepts HTTPS connections to npm registries, Netlify API, and GitHub.
- **PowerShell CLI Bypass**: For Node.js CLI execution (e.g. `netlify login`, `netlify deploy`), set `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"` in the execution environment.
- **Git Bypass**: `git config --global http.sslVerify false`.

### 2. Pure JavaScript / WebAssembly Native Dependency Fallback
- When C/C++ native addon compilation (`node-gyp rebuild`) fails due to blocked header downloads or native build tools:
  - Use pure JavaScript or WebAssembly implementations (e.g. `sql.js` for SQLite instead of `better-sqlite3`).

### 3. Netlify SPA Redirect Configuration (`netlify.toml`)
- Every Single Page Application deployed to Netlify must include a `netlify.toml` file with:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
