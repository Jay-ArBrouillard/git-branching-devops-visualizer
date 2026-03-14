const PROVIDERS = {
  github: {
    label: "GitHub",
    detailPage: "providers/github.html",
    tagline: "Developer-first collaboration platform with strong ecosystem and workflow flexibility.",
    bestFor: "Best for: open-source projects, SaaS product teams, and orgs prioritizing developer experience.",
    hosting: "Hosting model: GitHub.com (cloud) and GitHub Enterprise Server (self-managed).",
    pros: [
      "Large ecosystem and community adoption.",
      "Strong pull request and code review workflows.",
      "GitHub Actions + advanced security integration."
    ],
    cons: [
      "Enterprise governance depth may require higher-tier plans.",
      "Large enterprises may need careful policy tuning for scale.",
      "Actions cost/performance tuning is needed for heavy pipelines."
    ],
    tooling: [
      "Actions enables pipeline-as-code close to repository workflow.",
      "Code scanning and Dependabot support secure SDLC controls.",
      "Integrates well with Jira, Azure, Datadog, and cloud runtimes."
    ],
    matrix: {
      governance: "Medium to High",
      cicd: "High",
      openSource: "Excellent",
      selfHosted: "Available (Enterprise Server)",
      pricingShape: "Freemium to enterprise tiers",
      teamFit: "Broad, especially dev-centric teams"
    }
  },
  gitlab: {
    label: "GitLab",
    detailPage: "providers/gitlab.html",
    tagline: "Single-platform DevSecOps suite with integrated SCM, CI/CD, security, and planning.",
    bestFor: "Best for: organizations wanting one platform for planning through production operations.",
    hosting: "Hosting model: GitLab.com (cloud), Dedicated, and self-managed installations.",
    pros: [
      "Comprehensive end-to-end DevSecOps features.",
      "Strong built-in CI/CD and environment management.",
      "Good fit for compliance-heavy and regulated teams."
    ],
    cons: [
      "Broad feature set can increase onboarding complexity.",
      "UI and workflow tuning may take time for new users.",
      "License costs can rise with advanced enterprise features."
    ],
    tooling: [
      "Native pipeline stages and environment promotion controls are mature.",
      "Built-in security scans support shift-left practices.",
      "Works well for trunk and release train models with staged promotion controls."
    ],
    matrix: {
      governance: "High",
      cicd: "Very High",
      openSource: "Good",
      selfHosted: "Excellent",
      pricingShape: "Tiered SaaS and self-managed licensing",
      teamFit: "Platform teams and enterprise programs"
    }
  },
  bitbucket: {
    label: "Bitbucket",
    detailPage: "providers/bitbucket.html",
    tagline: "Atlassian ecosystem-friendly Git hosting focused on Jira-integrated delivery workflows.",
    bestFor: "Best for: teams deeply invested in Jira, Confluence, and Atlassian stack alignment.",
    hosting: "Hosting model: Bitbucket Cloud and Bitbucket Data Center.",
    pros: [
      "Strong Jira linkage and workflow traceability.",
      "Good team permission controls and repository structure.",
      "Bitbucket Pipelines supports integrated CI/CD."
    ],
    cons: [
      "Open-source visibility and community ecosystem are smaller.",
      "Advanced CI/CD breadth can lag broader platform suites.",
      "Feature depth varies between cloud and data center editions."
    ],
    tooling: [
      "Jira issue-to-branch/PR mapping is straightforward for change control.",
      "Pipelines covers common CI needs; complex setups may use external tools.",
      "Popular in organizations already standardized on Atlassian."
    ],
    matrix: {
      governance: "Medium to High",
      cicd: "Medium to High",
      openSource: "Moderate",
      selfHosted: "Good (Data Center)",
      pricingShape: "User-based tiers, enterprise data center",
      teamFit: "Atlassian-centric delivery organizations"
    }
  },
  azureRepos: {
    label: "Azure Repos",
    detailPage: "providers/azure-repos.html",
    tagline: "Enterprise Git hosting tightly integrated with Azure DevOps planning and pipelines.",
    bestFor: "Best for: Microsoft ecosystem organizations requiring enterprise policy and audit controls.",
    hosting: "Hosting model: Azure DevOps Services (cloud) and Azure DevOps Server.",
    pros: [
      "Strong integration with Azure Boards and Pipelines.",
      "Granular enterprise access and compliance controls.",
      "Good fit for large portfolio governance and reporting."
    ],
    cons: [
      "Developer experience may feel heavier than lightweight tools.",
      "Open-source community visibility is limited compared to GitHub.",
      "Best value often depends on broader Azure ecosystem usage."
    ],
    tooling: [
      "Pipeline templates and approvals support formal release governance.",
      "Works well with enterprise identity and policy frameworks.",
      "Traceability from work item to production deployment is strong."
    ],
    matrix: {
      governance: "High",
      cicd: "High",
      openSource: "Limited",
      selfHosted: "Available (Azure DevOps Server)",
      pricingShape: "Included in Azure DevOps tiering",
      teamFit: "Enterprise IT and regulated programs"
    }
  },
  gitea: {
    label: "Gitea / Forgejo",
    detailPage: "providers/gitea-forgejo.html",
    tagline: "Lightweight self-hosted Git forge emphasizing control, simplicity, and lower operating cost.",
    bestFor: "Best for: teams wanting private self-hosted Git with minimal infrastructure footprint.",
    hosting: "Hosting model: Primarily self-hosted; community-hosted options exist.",
    pros: [
      "Simple deployment and lower resource requirements.",
      "Full control of source hosting in private environments.",
      "Good fit for internal teams and air-gapped contexts."
    ],
    cons: [
      "Smaller ecosystem and fewer enterprise-native features.",
      "Advanced CI/CD usually requires external integrations.",
      "Operational ownership remains with your team."
    ],
    tooling: [
      "Pairs well with Jenkins, Drone, Woodpecker, or custom CI runners.",
      "Great for sovereignty requirements and minimal external dependencies.",
      "Best for organizations comfortable running their own platform."
    ],
    matrix: {
      governance: "Variable (self-managed)",
      cicd: "External tool dependent",
      openSource: "Good",
      selfHosted: "Excellent",
      pricingShape: "Open source + infra operating cost",
      teamFit: "Infrastructure-capable teams needing full control"
    }
  }
};

const PROVIDER_ORDER = ["github", "gitlab", "bitbucket", "azureRepos", "gitea"];

const state = {
  providerId: PROVIDER_ORDER[0]
};

const elements = {
  providerTabs: document.getElementById("providerTabs"),
  providerName: document.getElementById("providerName"),
  providerTagline: document.getElementById("providerTagline"),
  providerBestFor: document.getElementById("providerBestFor"),
  providerHosting: document.getElementById("providerHosting"),
  providerDetailLink: document.getElementById("providerDetailLink"),
  providerPros: document.getElementById("providerPros"),
  providerCons: document.getElementById("providerCons"),
  providerTooling: document.getElementById("providerTooling"),
  providerTable: document.getElementById("providerTable")
};

function renderProviderTabs() {
  elements.providerTabs.textContent = "";
  PROVIDER_ORDER.forEach((providerId) => {
    const provider = PROVIDERS[providerId];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-btn";
    button.textContent = provider.label;
    button.setAttribute("aria-pressed", String(state.providerId === providerId));
    button.addEventListener("click", () => {
      state.providerId = providerId;
      renderProviderTabs();
      renderProviderDetail();
    });
    elements.providerTabs.appendChild(button);
  });
}

function renderProviderDetail() {
  const provider = PROVIDERS[state.providerId];
  elements.providerName.textContent = provider.label;
  elements.providerTagline.textContent = provider.tagline;
  elements.providerBestFor.textContent = provider.bestFor;
  elements.providerHosting.textContent = provider.hosting;
  elements.providerDetailLink.href = provider.detailPage;
  elements.providerDetailLink.textContent = `Open ${provider.label} deep dive`;

  renderList(elements.providerPros, provider.pros);
  renderList(elements.providerCons, provider.cons);
  renderList(elements.providerTooling, provider.tooling);
}

function renderProviderTable() {
  const rows = [
    { label: "Governance depth", key: "governance" },
    { label: "Built-in CI/CD", key: "cicd" },
    { label: "Open-source friendliness", key: "openSource" },
    { label: "Self-hosted support", key: "selfHosted" },
    { label: "Pricing shape", key: "pricingShape" },
    { label: "Best team fit", key: "teamFit" }
  ];

  elements.providerTable.textContent = "";

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.appendChild(createCell("th", "Decision Dimension"));
  PROVIDER_ORDER.forEach((providerId) => {
    headRow.appendChild(createCell("th", PROVIDERS[providerId].label));
  });
  head.appendChild(headRow);

  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.appendChild(createCell("th", row.label));
    PROVIDER_ORDER.forEach((providerId) => {
      tr.appendChild(createCell("td", PROVIDERS[providerId].matrix[row.key]));
    });
    body.appendChild(tr);
  });

  elements.providerTable.appendChild(head);
  elements.providerTable.appendChild(body);
}

function renderList(target, values) {
  target.textContent = "";
  values.forEach((value) => {
    const li = document.createElement("li");
    li.textContent = value;
    target.appendChild(li);
  });
}

function createCell(tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
}

renderProviderTabs();
renderProviderDetail();
renderProviderTable();
