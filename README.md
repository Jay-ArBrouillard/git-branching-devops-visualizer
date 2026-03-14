# Git Branching DevOps Visualizer

Interactive static site for teaching Git branching strategy decisions and DevOps release flow design, including FlexDeploy webhook-driven promotion and rollback models.

## What This Project Covers

- Branching strategy comparison for:
  - Trunk-Based Development
  - GitHub Flow
  - Git Flow
- Scenario simulator for:
  - Standard change
  - Emergency change
  - Rollback (PR default and automation exception mode)
- FlexDeploy integration flowchart:
  - Git event to incoming webhook
  - Build once
  - QA/staging validation
  - Production promotion with approvals
- Supporting learning pages:
  - Git concepts
  - Advanced Git workflows
  - Git provider guides
  - Decision guide matrix

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- Static assets in `assets/icons`

No backend service is required.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start a local static server:

```bash
npx serve -l 4173 .
```

3. Open:

`http://localhost:4173`

## Main Pages

- `index.html` - Branching Visualizer homepage
- `decision-guide.html` - Strategy comparison and selection guide
- `concepts.html` - Git fundamentals
- `advanced-concepts.html` - Advanced Git workflows
- `providers.html` - Provider overview
- `providers/*.html` - Provider deep-dive pages

## Project Structure

- `app.js` - Core branching visualizer, scenario simulator, and FlexDeploy flowchart logic
- `styles.css` - Global styling and diagram styling
- `concepts.js` - Git concepts page logic
- `providers.js` - Provider explorer logic
- `simulator.js` / `conflict-simulator.js` - Interactive simulators

## Recommended Workflow

- Protect `main`
- Use short-lived branches and pull requests
- Keep rollback via reviewed revert PR as default
- Use automation rollback only as explicit break-glass exception with audit trail

## License

No license file is currently defined.
