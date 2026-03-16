# AGENTS.md

## Project Purpose

This repository contains a static teaching site for explaining:

- core Git concepts
- branching strategy choices
- pull requests, approvals, and branch protection
- DevOps release flow design
- FlexDeploy webhook-driven build/promote/rollback patterns

The site is used as a workshop and decision-support tool for clients aligning on a Git strategy across their stack.

## Tech Stack

- Static HTML pages
- One shared stylesheet: `styles.css`
- Vanilla JavaScript only
- Inline SVG diagrams for most custom visuals
- Static assets under `assets/`

There is no backend and no build pipeline. The site is intended to work as a GitHub Pages-style static deployment.

## Key Files

- `index.html`: homepage / branching visualizer
- `app.js`: main branching visualizer, scenario logic, FlexDeploy flowchart logic
- `decision-guide.html` + `decision-guide.js`: strategy comparison and workshop guidance
- `workflow-builder.html` + `workflow-builder.js`: guided workshop flow modeling, import/export, and preview
- `concepts.html`: Git concepts landing page
- `concepts/*.html`: Git learning subpages
- `developer-tools.html` and `developer-tools/*.html`: Git client / IDE guidance
- `providers.html` and `providers/*.html`: Git provider guidance
- `advanced-concepts.html`: advanced workflows
- `git-setup.html`: install/authentication setup guidance
- `styles.css`: shared visual system and component styling

## Working Rules

- Keep the project static. Do not introduce React, bundlers, frameworks, or server-side code unless explicitly requested.
- Reuse the existing design system in `styles.css` instead of inventing page-specific styling patterns when avoidable.
- Preserve the current site palette. Do not import colors from reference images; adapt examples into the site theme.
- Use the existing typography direction:
  - `Chakra Petch` for major headings / labels
  - `IBM Plex Sans` for body copy
  - `IBM Plex Mono` / monospace for commit hashes, commands, and Git object labels
- Keep the background neutral and professional. Avoid beige reference-image palettes, purple-heavy themes, or dark-mode-only treatments unless requested.
- Keep diagrams readable at typical laptop widths and on mobile. Avoid overlapping labels, clipped arrows, or text running off the SVG.
- Prefer simple, clear diagrams over dense or overly decorative visuals.
- Keep copy direct and instructional. The audience includes Git learners and client stakeholders, not only developers.

## Navigation And Page Consistency

- Navigation is duplicated across many HTML files. If a top-level page label, order, or URL changes, update every affected page manually.
- Many concept pages are standalone HTML pages, not template-driven. Check neighboring pages before assuming shared layout behavior.
- Some legacy concept pages act as redirects or compatibility stubs. If you rename or split concept content, update both the main links and any redirect pages.

## Diagram Guidelines

- Prefer inline SVG for custom Git diagrams and flowcharts.
- Use the site palette already established in `styles.css` and existing SVGs.
- Keep arrows, labels, and nodes visually balanced:
  - arrowheads should not clip into shapes
  - labels should not overlap nodes or lines
  - callouts should stay inside the SVG bounds
- When a user provides a reference image, match the structure and teaching intent, not the original color palette.
- For Git commit history visuals:
  - commits point backward to parent commits
  - first commit has no parent
  - merge commits may have two parents
- For branching strategy visuals:
  - reflect best practices already established elsewhere on the site
  - keep rollback explanations aligned with protected-branch workflows and FlexDeploy usage

## Content Guidelines

- Keep Git explanations technically correct and beginner-readable.
- Avoid redundant explanations across hero copy, pills, sequence sections, section notes, in-diagram text, and command rows.
- If the hero description already explains the main idea, remove adjacent pills or sequence sections that only repeat it.
- Use section notes for the primary explanation and keep in-diagram text short, supportive, and non-repetitive.
- Command rows should show the action being taken, not restate the same teaching point in prose.
- When both page copy and a diagram explain the same concept, make one the primary explanation and the other a concise reinforcement.
- If explaining Git internals:
  - distinguish commit hash, tree/snapshot reference, and parent reference(s)
  - avoid implying all commits always have exactly one parent
- If explaining rollback:
  - default to reviewed PR-based rollback for protected branches
  - only describe automation exceptions when explicitly framed as break-glass or tool-driven operational behavior
- Feature flags should be presented as optional, not assumed, especially for enterprise application contexts.
- FlexDeploy content should stay integrated with webhook-based orchestration and governed promotion language already used on the site.

## Developer Tools And Screenshots

- Tool screenshots live under `assets/screenshots/tools/`.
- Concept reference images live under `assets/screenshots/concepts/`.
- Keep screenshots relevant to the specific explanation on the page.
- If a screenshot is replaced, keep filenames and relative paths stable unless there is a reason to restructure.

## JavaScript Guidelines

- Keep scripts framework-free and page-oriented.
- Favor small, local DOM logic over abstract architecture.
- Reuse existing patterns in:
  - `app.js`
  - `decision-guide.js`
  - `workflow-builder.js`
  - `concepts.js`
  - `providers.js`
  - `simulator.js`
  - `conflict-simulator.js`
- If adding interaction to a single page, inline script is acceptable when it is tightly coupled to that page's SVG or content.
- Avoid adding dependencies for simple UI behavior.

## Validation

- There are no meaningful automated tests in this repo today.
- For local verification, serve the site statically:

```bash
npx serve -l 4173 .
```

- Then manually verify affected pages in a browser.
- For UI changes, check:
  - desktop layout
  - mobile layout
  - SVG readability
  - nav links
  - hover/tooltip behavior if changed

## Repo Notes

- `package.json` currently exists only to support local static serving.
- Do not assume generated assets can be deleted unless explicitly requested.
