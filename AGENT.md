# AGENT.md

This file provides guidance to coding agents when working with code in this repository.

## Overview

Monorepo for the static websites of three family small businesses plus the AWS infrastructure that hosts them:

- **Autodoprava Šrámek** — `www/sramek-transportation/` → `sramek-autodoprava.cz` (transportation/earthworks/container rental; Bootstrap-based)
- **Zahradnictví Šrámek** — `www/sramek-garden-center/` → `zahradnictvi-sramek.cz` (garden center; jQuery/Sass "Editorial" template)
- **Studio Šrámek** — `www/sramek-garden-arch/` → garden-architecture portfolio (bilingual CZ/EN, hand-rolled design system). **Not yet wired into deployment** (see below) - still in development.
- **`infra/`** — Pulumi program (Go) that provisions all AWS resources.

All site content is in Czech. When editing copy, preserve Czech diacritics (á, č, ř, ž, etc.) — several past bugs were mojibake in `<meta>` tags.

## Environment

Uses a Nix flake for the toolchain (Go, Node 22, awscli2, pulumi, html-tidy, python3). Enter the shell before running any commands:

```bash
nix develop
```

CI (`.github/workflows/pipeline.yml`) runs `nix develop --command ...` on pull requests and only Parcel-builds the two live sites — it does **not** deploy. There are no automated tests.

## Common commands

Per-site (run from inside a `www/<site>/` directory):

```bash
npm install            # first time, per site — deps are per-site, not hoisted
npm run dev            # Parcel dev server with HMR
npm run buildstatic    # Parcel production build to dist/, then copies static extras
```

`buildstatic` matters because Parcel does not process files not referenced from HTML. It builds `index.html` then copies the extras into `dist/`:
- garden-center: `robots.txt sitemap.xml .htaccess`
- transportation: `assets/json/pricing.json robots.txt sitemap.xml .htaccess`

Pre-commit check (Go fmt/build + HTML tidy over the garden-center):

```bash
./scripts/pre-commit.bash
```

Full deploy (builds both live sites, then applies infra):

```bash
./scripts/deploy.bash    # runs buildstatic for both sites + `pulumi up` in infra/
```

Infra only (from `infra/`, requires AWS credentials + Pulumi state access):

```bash
pulumi preview           # dry run
pulumi up                # apply; stack config is Pulumi.prod.yaml
```

Go infra code (from `infra/src/`):

```bash
go build -o /dev/null    # compile check
go fmt ./...
```

## Architecture

### Static sites → Parcel

Each site is an independent Parcel project with its own `package.json` and `node_modules`. Entry point is always `index.html`; Parcel discovers other pages/assets by following links from the HTML. Notable Parcel config:
- garden-center's `.parcelrc` disables the SVG optimizer (`"*.svg": []`).
- Both use `@parcel/transformer-jsonld` (JSON-LD structured data is emitted from HTML) and `@parcel/packager-raw-url`.

The garden-center and transportation sites are the two "live" projects; the `projects` slice in `infra/src/main.go` is the source of truth for what gets deployed. `sramek-garden-arch` exists in the repo but is **not** in that slice, not in `Pulumi.prod.yaml`, and not built by CI — it currently ships as pure static HTML (`python3 -m http.server`) and must be added to all three places to go live.

### Infrastructure → Pulumi (Go)

`infra/src/` is a single Go `main` package. Flow in `main.go`:
1. Create a shared request-logs S3 bucket.
2. Deploy one global **redirect edge lambda** (us-east-1) — see below.
3. For each project in `projects`, `deployProject` builds the full stack.
4. Provision SES for transactional mail (`simpleMailService`).

Per project, `deployProject` (main.go + utils.go) creates:
- an S3 website bucket, with every file in the site's `dist/` uploaded as a `BucketObject` (recursively, MIME-typed; the `www/<name>` prefix is stripped so files land at bucket root);
- a CloudFront distribution (1-week default TTL; per-extension cache behaviors for `*.webp`/`*.js`/`*.css`);
- an ACM certificate in **us-east-1** (CloudFront requirement) validated via Route53 DNS records;
- Route53 A-alias records for both the apex domain and its `www.` subdomain.

**Domain convention:** `getDomainWithSubdomains` expands a bare `example.com` from config into `[example.com, www.example.com]`. Config domains must be bare apex domains (the code `log.Fatal`s on anything with a subdomain). The redirect edge lambda (`lambda/lambda_redirect.mjs`) 301-redirects apex → `www.` on every viewer request, skipping static assets to stay under the Lambda@Edge size/rate limits.

**Lambdas** (`lambda.go`) are authored as `.mjs` files under `infra/src/lambda/`, zipped at deploy time via `archive.LookupFile` into `infra/dist/` (gitignored), and deployed as Node lambdas. `lambda_redirect` runs at the CloudFront edge (us-east-1, nodejs20); `lambda_send_mail` + `lambda_cors` back the contact-form API Gateway (`send_mail.go`) using SES. Editing lambda behavior = edit the `.mjs`; `SourceCodeHash` triggers redeploy automatically.

**Config** lives in `infra/Pulumi.prod.yaml` under per-project namespaces (`sramek-garden-center:dir`, `:domain`, `:index-doc`, `:error-doc`, `:cors`, ...). `dir` paths are relative to `infra/src/` and point at each site's `dist/`, so sites must be built before `pulumi up`.

## Conventions

- Each site keeps its own `robots.txt`, `sitemap.xml`, and `.htaccess` that must be listed in that site's `buildstatic` copy step to reach `dist/` — adding a new one means updating `package.json`.
- SEO metadata (canonical, Open Graph, JSON-LD `LocalBusiness`, keywords) is maintained by hand across all pages; keep it consistent when adding pages, and keep `sitemap.xml` `lastmod` dates current.
- The garden-center site has a `holiday-hours.js` that overrides displayed opening hours for holidays — update it when holidays change rather than editing static hours.
