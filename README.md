# ImmortaClock

[![oparts](https://img.shields.io/badge/∅-oparts-6a5acd)](https://github.com/elzup/oparts-spec)

A minimal-dependency, framework-free "long-lived" web clock. Runs as a single
HTML file and self-diagnoses **its dependency layers and how many years it has left**.

**Demo (independent mirrors — redundancy is the point):**

- GitHub Pages: https://elzup.github.io/ImmortaClock/
- Cloudflare Workers: https://immorta-clock.anozon.workers.dev/
- GitLab Pages: https://elzup.gitlab.io/ImmortaClock/

The same single file is served from three independent operators, so its lifespan
is set by the longest-surviving mirror, not the shortest (see `design:hosting-redundancy`).

## Features

- **Single file**: just `index.html`. Zero build, CDN, or external resources. Works over `file://`.
- **Minimal deps**: formatting uses only basic `Date` methods (no `Temporal` / `Intl`).
- **Self-diagnosis**: computes each layer's lifespan (host/file, browser API, runtime, ...)
  and shows effective vs. precision lifespan. Retired / N-A items are listed with reasons.
- **i18n**: ja / en toggle.

## Development

Specs and tests are managed with VCSDD under `.vsdd/immortaclock/`.

```sh
cd .vsdd/immortaclock
node --test tests/*.test.mjs   # logic / DOM / single-file / static wiring / CEG gate
node ceg.mjs validate          # validate spec dependency graph (CEG)
node ceg.mjs rank              # robustness rank by transitive deps
```
