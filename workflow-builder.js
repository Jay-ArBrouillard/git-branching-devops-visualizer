const WORKFLOW_BUILDER_STORAGE_KEY = "gitBranchingWorkflowBuilderDraftV1";

const WORKFLOW_STEP_LIBRARY = {
  git: {
    label: "Git Event",
    icon: "G",
    accent: "#557eaa",
    tag: "Git",
    title: "Git Event",
    detail: "Commit, PR, merge, or tag becomes the next workflow trigger.",
    command: "Open PR or merge approved change"
  },
  review: {
    label: "Review / Approval",
    icon: "R",
    accent: "#7b66b2",
    tag: "Approval",
    title: "Review Gate",
    detail: "Human review, CAB sign-off, or platform-based validation confirms the change.",
    command: "Capture approval and evidence"
  },
  webhook: {
    label: "Webhook Trigger",
    icon: "W",
    accent: "#2f9c90",
    tag: "Webhook",
    title: "Incoming Webhook",
    detail: "A Git or release event hands control into FlexDeploy or another automation layer.",
    command: "POST webhook payload with branch and SHA"
  },
  build: {
    label: "Build Once",
    icon: "B",
    accent: "#f08a24",
    tag: "Artifact",
    title: "Build Once",
    detail: "Create one release artifact or deployment snapshot from the approved source.",
    command: "Build immutable artifact once"
  },
  deploy: {
    label: "Deploy",
    icon: "D",
    accent: "#d95b46",
    tag: "Deploy",
    title: "Deploy",
    detail: "Promote or deploy the tracked version into the next environment.",
    command: "Promote approved version"
  },
  env: {
    label: "Environment Review",
    icon: "E",
    accent: "#2f8f83",
    tag: "Validation",
    title: "Environment Review",
    detail: "Testing, Oracle cloud review, or business validation happens in the runtime platform.",
    command: "Validate in QA / Oracle cloud environment"
  },
  rollback: {
    label: "Rollback",
    icon: "X",
    accent: "#c04f3f",
    tag: "Recovery",
    title: "Rollback",
    detail: "Restore service quickly, then align Git history or release state.",
    command: "Restore tracked version or revert source"
  },
  note: {
    label: "Decision Note",
    icon: "N",
    accent: "#587ca1",
    tag: "Note",
    title: "Policy Note",
    detail: "Capture an exception, workshop decision, or platform constraint in the flow.",
    command: "Document policy or exception"
  }
};

const WORKFLOW_TEMPLATES = {
  blank: {
    label: "Blank Workshop Flow",
    description: "Start from scratch with a minimal lane set.",
    meta: {
      name: "Blank workflow",
      description: "Use this to sketch a client-specific process from zero."
    },
    lanes: [
      { id: "lane-git", name: "Git / Source", color: "#1f4c77" },
      { id: "lane-automation", name: "Automation", color: "#2f8f83" },
      { id: "lane-release", name: "Release / Environments", color: "#b27829" }
    ],
    steps: []
  },
  githubFlow: {
    label: "GitHub Flow + FlexDeploy",
    description: "Feature validation before merge, release artifact after merge to main.",
    meta: {
      name: "GitHub Flow workshop model",
      description: "Use when teams want independent change movement and production always follows main."
    },
    lanes: [
      { id: "lane-feature", name: "feature/*", color: "#557eaa" },
      { id: "lane-main", name: "main", color: "#1f4c77" },
      { id: "lane-flex", name: "FlexDeploy", color: "#2f8f83" },
      { id: "lane-env", name: "QA / Staging / Prod", color: "#b27829" }
    ],
    steps: [
      { type: "git", laneId: "lane-feature", title: "Feature branch work", tag: "Git", detail: "Develop and validate on a short-lived feature branch.", command: "git switch -c feature/order-discount" },
      { type: "deploy", laneId: "lane-env", title: "Optional preview deploy", tag: "Preview", detail: "Optional pre-merge validation deploy from the feature branch.", command: "Deploy preview environment" },
      { type: "review", laneId: "lane-main", title: "PR approval to main", tag: "PR", detail: "Merge only after review and required checks pass.", command: "Open PR: feature/order-discount -> main" },
      { type: "webhook", laneId: "lane-flex", title: "Merge webhook", tag: "Webhook", detail: "Protected main merge triggers FlexDeploy.", command: "Send merged main SHA to FlexDeploy" },
      { type: "build", laneId: "lane-flex", title: "Build once from main", tag: "Artifact", detail: "Create one immutable artifact from merged main.", command: "Build release artifact from main" },
      { type: "env", laneId: "lane-env", title: "QA and staging validation", tag: "Validation", detail: "Shared QA and staging validate the same built artifact.", command: "Promote same artifact to QA and staging" },
      { type: "deploy", laneId: "lane-env", title: "Production deploy", tag: "Deploy", detail: "Production promotes the approved main-built artifact.", command: "Promote approved artifact to production" }
    ]
  },
  releaseFlow: {
    label: "Release Flow",
    description: "main integrates, release branch owns governed validation and promotion.",
    meta: {
      name: "Release Flow workshop model",
      description: "Use when approvals and shared QA/UAT need a governed release line."
    },
    lanes: [
      { id: "lane-feature", name: "feature/*", color: "#557eaa" },
      { id: "lane-main", name: "main", color: "#1f4c77" },
      { id: "lane-release", name: "release/*", color: "#b27829" },
      { id: "lane-flex", name: "FlexDeploy", color: "#2f8f83" },
      { id: "lane-env", name: "QA / Staging / Prod", color: "#d95b46" }
    ],
    steps: [
      { type: "git", laneId: "lane-feature", title: "Feature branch validation", tag: "Git", detail: "Develop and validate short-lived feature branches.", command: "git switch -c feature/payment-tuning" },
      { type: "review", laneId: "lane-main", title: "Merge to main", tag: "PR", detail: "Approved features integrate into main under normal review policy.", command: "Open PR: feature/payment-tuning -> main" },
      { type: "git", laneId: "lane-release", title: "Cut release branch", tag: "Release", detail: "Create release/* from the merged main baseline.", command: "git switch -c release/2026.03" },
      { type: "webhook", laneId: "lane-flex", title: "Release branch webhook", tag: "Webhook", detail: "Protected release/* update triggers FlexDeploy.", command: "Send release branch payload + SHA" },
      { type: "build", laneId: "lane-flex", title: "Build once from release/*", tag: "Artifact", detail: "One governed artifact is built from the protected release line.", command: "Build artifact from release/*" },
      { type: "env", laneId: "lane-env", title: "Shared QA / staging sign-off", tag: "Validation", detail: "The same release artifact is validated while approvals proceed.", command: "Promote same artifact to QA and staging" },
      { type: "deploy", laneId: "lane-env", title: "Production approval + deploy", tag: "Prod", detail: "Production promotes the approved release artifact without rebuilding.", command: "Promote approved release artifact" }
    ]
  },
  gitFlow: {
    label: "Git Flow",
    description: "Develop, release, and hotfix lanes with formal release trains.",
    meta: {
      name: "Git Flow workshop model",
      description: "Use when develop, release, and hotfix lanes are all required for governance."
    },
    lanes: [
      { id: "lane-feature", name: "feature/*", color: "#557eaa" },
      { id: "lane-develop", name: "develop", color: "#2f8f83" },
      { id: "lane-release", name: "release/*", color: "#b27829" },
      { id: "lane-main", name: "main", color: "#1f4c77" },
      { id: "lane-flex", name: "FlexDeploy", color: "#d95b46" }
    ],
    steps: [
      { type: "git", laneId: "lane-feature", title: "Feature branch work", tag: "Git", detail: "Implement and validate on a dedicated feature branch.", command: "git switch -c feature/customer-segmentation" },
      { type: "review", laneId: "lane-develop", title: "Merge into develop", tag: "PR", detail: "Develop collects approved feature branches.", command: "Open PR: feature/customer-segmentation -> develop" },
      { type: "git", laneId: "lane-release", title: "Create release branch", tag: "Release", detail: "Cut release/* for hardening, testing, and CAB review.", command: "git switch -c release/2.6.0 develop" },
      { type: "build", laneId: "lane-flex", title: "Build release candidate", tag: "Artifact", detail: "Build the release artifact from release/* or the approved tag.", command: "Build once from release/2.6.0" },
      { type: "env", laneId: "lane-flex", title: "UAT and approval gates", tag: "Validation", detail: "Run governed test, approval, and sign-off steps before production.", command: "Promote to UAT and hold for CAB" },
      { type: "deploy", laneId: "lane-main", title: "Tag and merge to main", tag: "Prod", detail: "Approved release merges to main and is tagged for production traceability.", command: "Tag v2.6.0 from main" }
    ]
  },
  oraclePlatform: {
    label: "Oracle Cloud Review Outside Git",
    description: "Model where exported artifacts go to Git, but real review happens in Oracle environments.",
    meta: {
      name: "Oracle environment-reviewed flow",
      description: "Use when Oracle cloud applications export binaries to Git and the meaningful review happens in the platform, not in PR diffs."
    },
    lanes: [
      { id: "lane-oracle-dev", name: "Oracle Dev Cloud", color: "#557eaa" },
      { id: "lane-oracle-review", name: "Oracle Review / UAT", color: "#2f8f83" },
      { id: "lane-git", name: "Git Traceability", color: "#1f4c77" },
      { id: "lane-flex", name: "FlexDeploy", color: "#b27829" },
      { id: "lane-prod", name: "Production", color: "#d95b46" }
    ],
    steps: [
      { type: "env", laneId: "lane-oracle-dev", title: "Develop in Oracle cloud", tag: "Oracle", detail: "Changes are made directly in the Oracle platform environment.", command: "Develop and export platform artifact" },
      { type: "env", laneId: "lane-oracle-review", title: "Review in Oracle environment", tag: "Platform Review", detail: "Functional or business review happens in the Oracle review environment.", command: "Validate in Oracle review / UAT" },
      { type: "git", laneId: "lane-git", title: "Export to Git", tag: "Binary Export", detail: "Git stores exported content for traceability even when diff review is limited.", command: "Commit exported package to main or release branch" },
      { type: "review", laneId: "lane-git", title: "Approval evidence", tag: "Audit", detail: "PR or branch protection acts mainly as an approval and audit gate.", command: "Record approver and change ticket" },
      { type: "webhook", laneId: "lane-flex", title: "Webhook into FlexDeploy", tag: "Webhook", detail: "Approved Git event hands control into deployment automation.", command: "Send branch, version, and ticket metadata" },
      { type: "build", laneId: "lane-flex", title: "Track deployment snapshot", tag: "Artifact", detail: "Capture the export package or deployment snapshot as the governed version.", command: "Register deployment snapshot" },
      { type: "deploy", laneId: "lane-prod", title: "Promote through governed environments", tag: "Deploy", detail: "FlexDeploy manages staged promotion and rollback tracking.", command: "Promote approved Oracle package" }
    ]
  },
  oracleDatabase: {
    label: "Oracle Database + PR Review",
    description: "Model where Git PR review is still meaningful because source code is reviewable.",
    meta: {
      name: "Oracle database code-review flow",
      description: "Use when Git diffs are real source review and FlexDeploy still owns downstream promotion."
    },
    lanes: [
      { id: "lane-feature", name: "feature/*", color: "#557eaa" },
      { id: "lane-main", name: "main", color: "#1f4c77" },
      { id: "lane-flex", name: "FlexDeploy", color: "#2f8f83" },
      { id: "lane-env", name: "DB QA / Prod", color: "#b27829" }
    ],
    steps: [
      { type: "git", laneId: "lane-feature", title: "Database change branch", tag: "SQL / PL/SQL", detail: "Implement database code change on a short-lived feature branch.", command: "git switch -c feature/db-index-tuning" },
      { type: "review", laneId: "lane-main", title: "PR review in Git", tag: "PR", detail: "Meaningful code review happens in the Git provider before merge.", command: "Open PR: feature/db-index-tuning -> main" },
      { type: "webhook", laneId: "lane-flex", title: "Merge webhook", tag: "Webhook", detail: "Approved main merge triggers FlexDeploy.", command: "Send merged main SHA" },
      { type: "build", laneId: "lane-flex", title: "Build database artifact", tag: "Artifact", detail: "Create the tracked deployment artifact from main.", command: "Package database deployment artifact" },
      { type: "env", laneId: "lane-env", title: "DB QA validation", tag: "Validation", detail: "Run database validation and approval in QA.", command: "Promote same artifact to QA" },
      { type: "deploy", laneId: "lane-env", title: "Production deployment", tag: "Deploy", detail: "Promote the approved main-built database artifact to production.", command: "Promote approved artifact to prod" }
    ]
  }
};

const elements = {
  templateSelect: document.getElementById("workflowTemplateSelect"),
  loadTemplateBtn: document.getElementById("workflowLoadTemplateBtn"),
  resetBtn: document.getElementById("workflowResetBtn"),
  presentBtn: document.getElementById("workflowPresentBtn"),
  saveStatus: document.getElementById("workflowSaveStatus"),
  nameInput: document.getElementById("workflowNameInput"),
  descriptionInput: document.getElementById("workflowDescriptionInput"),
  laneList: document.getElementById("workflowLaneList"),
  addLaneBtn: document.getElementById("workflowAddLaneBtn"),
  palette: document.getElementById("workflowPalette"),
  sequence: document.getElementById("workflowSequence"),
  previewSvg: document.getElementById("workflowPreviewSvg"),
  previewCaption: document.getElementById("workflowPreviewCaption"),
  stepEmpty: document.getElementById("workflowStepEmpty"),
  stepForm: document.getElementById("workflowStepForm"),
  stepTitleInput: document.getElementById("workflowStepTitleInput"),
  stepTypeSelect: document.getElementById("workflowStepTypeSelect"),
  stepLaneSelect: document.getElementById("workflowStepLaneSelect"),
  stepTagInput: document.getElementById("workflowStepTagInput"),
  stepDetailInput: document.getElementById("workflowStepDetailInput"),
  stepCommandInput: document.getElementById("workflowStepCommandInput"),
  duplicateStepBtn: document.getElementById("workflowDuplicateStepBtn"),
  deleteStepBtn: document.getElementById("workflowDeleteStepBtn"),
  exportJsonBtn: document.getElementById("workflowExportJsonBtn"),
  importJsonBtn: document.getElementById("workflowImportJsonBtn"),
  exportSvgBtn: document.getElementById("workflowExportSvgBtn"),
  exportPngBtn: document.getElementById("workflowExportPngBtn"),
  importInput: document.getElementById("workflowImportInput")
};

const laneColorCycle = ["#1f4c77", "#557eaa", "#2f8f83", "#b27829", "#d95b46", "#7b66b2", "#587ca1"];

let state = null;
let currentDragPayload = null;
let saveTimeout = null;
let idSeed = 1;

function nextId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${idSeed++}`;
}

function cloneTemplate(templateId) {
  const template = WORKFLOW_TEMPLATES[templateId] || WORKFLOW_TEMPLATES.blank;
  const lanes = template.lanes.map((lane) => ({
    id: lane.id,
    name: lane.name,
    color: lane.color
  }));
  const steps = template.steps.map((step) => ({
    id: nextId("step"),
    type: step.type,
    laneId: step.laneId || lanes[0].id,
    title: step.title,
    tag: step.tag || WORKFLOW_STEP_LIBRARY[step.type]?.tag || "",
    detail: step.detail || "",
    command: step.command || ""
  }));
  return {
    templateId,
    presentMode: false,
    meta: {
      name: template.meta.name,
      description: template.meta.description
    },
    lanes,
    steps,
    selectedStepId: steps[0]?.id || null
  };
}

function normalizeWorkflowState(payload) {
  const base = cloneTemplate("blank");
  if (!payload || typeof payload !== "object") {
    return base;
  }

  const lanes = Array.isArray(payload.lanes)
    ? payload.lanes
        .filter((lane) => lane && typeof lane === "object")
        .map((lane, index) => ({
          id: typeof lane.id === "string" && lane.id ? lane.id : nextId("lane"),
          name: typeof lane.name === "string" && lane.name.trim() ? lane.name.trim() : `Lane ${index + 1}`,
          color: typeof lane.color === "string" && lane.color ? lane.color : laneColorCycle[index % laneColorCycle.length]
        }))
    : base.lanes;

  const fallbackLaneId = lanes[0]?.id || base.lanes[0].id;
  const steps = Array.isArray(payload.steps)
    ? payload.steps
        .filter((step) => step && typeof step === "object")
        .map((step, index) => ({
          id: typeof step.id === "string" && step.id ? step.id : nextId("step"),
          type: WORKFLOW_STEP_LIBRARY[step.type] ? step.type : "note",
          laneId: lanes.some((lane) => lane.id === step.laneId) ? step.laneId : fallbackLaneId,
          title:
            typeof step.title === "string" && step.title.trim()
              ? step.title.trim()
              : `${WORKFLOW_STEP_LIBRARY[step.type]?.label || "Step"} ${index + 1}`,
          tag: typeof step.tag === "string" ? step.tag : "",
          detail: typeof step.detail === "string" ? step.detail : "",
          command: typeof step.command === "string" ? step.command : ""
        }))
    : base.steps;

  const selectedStepId = steps.some((step) => step.id === payload.selectedStepId)
    ? payload.selectedStepId
    : steps[0]?.id || null;

  return {
    templateId: typeof payload.templateId === "string" ? payload.templateId : "blank",
    presentMode: Boolean(payload.presentMode),
    meta: {
      name:
        typeof payload.meta?.name === "string" && payload.meta.name.trim()
          ? payload.meta.name.trim()
          : "Custom workflow",
      description:
        typeof payload.meta?.description === "string" ? payload.meta.description : ""
    },
    lanes,
    steps,
    selectedStepId
  };
}

function getSelectedStep() {
  return state.steps.find((step) => step.id === state.selectedStepId) || null;
}

function scheduleSave(message = "Saved locally") {
  window.clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(() => {
    try {
      window.localStorage.setItem(WORKFLOW_BUILDER_STORAGE_KEY, JSON.stringify(state));
      setSaveStatus(message);
    } catch (_error) {
      setSaveStatus("Local save unavailable");
    }
  }, 120);
}

function setSaveStatus(message) {
  if (elements.saveStatus) {
    elements.saveStatus.textContent = message;
  }
}

function renderTemplateOptions() {
  elements.templateSelect.innerHTML = "";
  Object.entries(WORKFLOW_TEMPLATES).forEach(([id, template]) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = template.label;
    elements.templateSelect.appendChild(option);
  });
}

function renderPalette() {
  elements.palette.innerHTML = "";
  Object.entries(WORKFLOW_STEP_LIBRARY).forEach(([type, stepType]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "workflow-palette-item";
    item.draggable = true;
    item.dataset.stepType = type;
    item.style.setProperty("--workflow-accent", stepType.accent);
    item.innerHTML = `
      <span class="workflow-palette-icon">${stepType.icon}</span>
      <span class="workflow-palette-copy">
        <strong>${stepType.label}</strong>
        <small>${stepType.detail}</small>
      </span>
    `;
    elements.palette.appendChild(item);
  });
}

function renderWorkflowMeta() {
  elements.nameInput.value = state.meta.name;
  elements.descriptionInput.value = state.meta.description;
  elements.templateSelect.value = WORKFLOW_TEMPLATES[state.templateId] ? state.templateId : "blank";
  document.body.classList.toggle("workflow-present-mode", Boolean(state.presentMode));
  elements.presentBtn.textContent = state.presentMode ? "Exit Presentation Mode" : "Presentation Mode";
}

function renderLaneManager() {
  elements.laneList.innerHTML = "";
  state.lanes.forEach((lane, index) => {
    const row = document.createElement("div");
    row.className = "workflow-lane-row";
    row.innerHTML = `
      <span class="workflow-lane-swatch" style="background:${lane.color}"></span>
      <input class="workflow-lane-name-input" data-lane-id="${lane.id}" type="text" value="${escapeHtml(lane.name)}" />
      <input class="workflow-lane-color-input" data-lane-id="${lane.id}" type="color" value="${lane.color}" aria-label="Lane color for ${escapeHtml(lane.name)}" />
      <div class="workflow-lane-actions">
        <button type="button" class="workflow-mini-btn" data-lane-action="up" data-lane-id="${lane.id}" ${index === 0 ? "disabled" : ""}>Up</button>
        <button type="button" class="workflow-mini-btn" data-lane-action="down" data-lane-id="${lane.id}" ${index === state.lanes.length - 1 ? "disabled" : ""}>Down</button>
        <button type="button" class="workflow-mini-btn workflow-mini-btn-danger" data-lane-action="remove" data-lane-id="${lane.id}" ${state.lanes.length === 1 ? "disabled" : ""}>X</button>
      </div>
    `;
    elements.laneList.appendChild(row);
  });
}

function buildDropSlot(index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "workflow-drop-slot";
  button.dataset.insertIndex = String(index);
  button.setAttribute("aria-label", `Insert step at position ${index + 1}`);
  button.textContent = "+";
  return button;
}

function renderSequenceBoard() {
  elements.sequence.innerHTML = "";
  if (state.steps.length === 0) {
    const empty = document.createElement("div");
    empty.className = "workflow-sequence-empty";
    empty.innerHTML = `
      <p>Drag a step type here to start the workflow.</p>
      <small>Templates give you a head start, but blank mode is available too.</small>
    `;
    elements.sequence.appendChild(buildDropSlot(0));
    elements.sequence.appendChild(empty);
    return;
  }

  elements.sequence.appendChild(buildDropSlot(0));
  state.steps.forEach((step, index) => {
    const stepType = WORKFLOW_STEP_LIBRARY[step.type] || WORKFLOW_STEP_LIBRARY.note;
    const lane = state.lanes.find((item) => item.id === step.laneId) || state.lanes[0];
    const card = document.createElement("article");
    card.className = `workflow-step-card${step.id === state.selectedStepId ? " is-selected" : ""}`;
    card.draggable = true;
    card.tabIndex = 0;
    card.dataset.stepId = step.id;
    card.style.setProperty("--workflow-accent", stepType.accent);
    card.innerHTML = `
      <div class="workflow-step-top">
        <span class="workflow-step-type">${stepType.icon} ${stepType.label}</span>
        <span class="workflow-step-lane" style="border-color:${lane.color}; color:${lane.color};">${escapeHtml(lane.name)}</span>
      </div>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.detail || "No detail yet. Use the editor to define the step.")}</p>
      <div class="workflow-step-bottom">
        <span class="workflow-step-tag">${escapeHtml(step.tag || "untagged")}</span>
        <code>${escapeHtml(compactCommand(step.command))}</code>
      </div>
    `;
    elements.sequence.appendChild(card);
    elements.sequence.appendChild(buildDropSlot(index + 1));
  });
}

function renderStepEditor() {
  const step = getSelectedStep();
  elements.stepTypeSelect.innerHTML = "";
  Object.entries(WORKFLOW_STEP_LIBRARY).forEach(([type, stepType]) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = stepType.label;
    elements.stepTypeSelect.appendChild(option);
  });

  elements.stepLaneSelect.innerHTML = "";
  state.lanes.forEach((lane) => {
    const option = document.createElement("option");
    option.value = lane.id;
    option.textContent = lane.name;
    elements.stepLaneSelect.appendChild(option);
  });

  if (!step) {
    elements.stepEmpty.hidden = false;
    elements.stepForm.hidden = true;
    return;
  }

  elements.stepEmpty.hidden = true;
  elements.stepForm.hidden = false;
  elements.stepTitleInput.value = step.title;
  elements.stepTypeSelect.value = step.type;
  elements.stepLaneSelect.value = step.laneId;
  elements.stepTagInput.value = step.tag;
  elements.stepDetailInput.value = step.detail;
  elements.stepCommandInput.value = step.command;
}

function renderPreview() {
  const svg = elements.previewSvg;
  svg.textContent = "";

  const lanes = state.lanes;
  const steps = state.steps;
  const top = 76;
  const left = 200;
  const rowGap = 118;
  const stepGap = 212;
  const cardWidth = 182;
  const cardHeight = 96;
  const right = 70;
  const bottom = 88;
  const width = Math.max(980, left + right + Math.max(0, steps.length - 1) * stepGap + cardWidth);
  const height = top + Math.max(0, lanes.length - 1) * rowGap + bottom;

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const defs = createSvg("defs");
  const marker = createSvg("marker", {
    id: "workflow-preview-arrow",
    viewBox: "0 0 10 10",
    refX: "8.8",
    refY: "5",
    markerWidth: "6.4",
    markerHeight: "6.4",
    orient: "auto"
  });
  marker.appendChild(createSvg("path", { d: "M0 0 L10 5 L0 10 z", fill: "#587ca1" }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const laneMap = new Map();
  lanes.forEach((lane, index) => {
    laneMap.set(lane.id, top + index * rowGap);
  });

  lanes.forEach((lane) => {
    const y = laneMap.get(lane.id);
    svg.appendChild(
      createSvg("line", {
        x1: String(left - 22),
        y1: String(y),
        x2: String(width - 40),
        y2: String(y),
        stroke: lane.color,
        "stroke-width": "2.3",
        "stroke-linecap": "round",
        opacity: "0.62"
      })
    );
    svg.appendChild(
      createSvg("text", {
        x: "18",
        y: String(y + 5),
        fill: "#335678",
        "font-family": "'Chakra Petch', 'IBM Plex Sans', sans-serif",
        "font-size": "23",
        "font-weight": "700"
      }, lane.name)
    );
  });

  if (steps.length === 0) {
    svg.appendChild(
      createSvg("text", {
        x: String(width / 2),
        y: String(height / 2 - 12),
        "text-anchor": "middle",
        fill: "#335678",
        "font-family": "'Chakra Petch', 'IBM Plex Sans', sans-serif",
        "font-size": "28",
        "font-weight": "700"
      }, "Drag step types into the workflow")
    );
    svg.appendChild(
      createSvg("text", {
        x: String(width / 2),
        y: String(height / 2 + 16),
        "text-anchor": "middle",
        fill: "#59728f",
        "font-family": "'IBM Plex Sans', sans-serif",
        "font-size": "15",
        "font-weight": "600"
      }, "The preview updates automatically as you edit the sequence, lanes, and step details.")
    );
    elements.previewCaption.textContent = "No steps yet. Use a template or drag a step type into the sequence board.";
    return;
  }

  const points = steps.map((step, index) => {
    const lane = lanes.find((item) => item.id === step.laneId) || lanes[0];
    const centerX = left + index * stepGap;
    const centerY = laneMap.get(step.laneId) || laneMap.get(lanes[0].id);
    return {
      ...step,
      lane,
      x: centerX - cardWidth / 2,
      y: centerY - cardHeight / 2,
      centerX,
      centerY
    };
  });

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const dx = end.centerX - start.centerX;
    const dy = end.centerY - start.centerY;
    const distance = Math.hypot(dx, dy) || 1;
    const ux = dx / distance;
    const uy = dy / distance;
    const startX = start.centerX + ux * (cardWidth / 2 - 8);
    const startY = start.centerY + uy * (cardHeight / 2 - 20);
    const endX = end.centerX - ux * (cardWidth / 2 - 8);
    const endY = end.centerY - uy * (cardHeight / 2 - 20);
    svg.appendChild(
      createSvg("line", {
        x1: String(startX),
        y1: String(startY),
        x2: String(endX),
        y2: String(endY),
        stroke: end.lane.color,
        "stroke-width": "3.2",
        "stroke-linecap": "round",
        "marker-end": "url(#workflow-preview-arrow)"
      })
    );
  }

  points.forEach((point, index) => {
    const stepType = WORKFLOW_STEP_LIBRARY[point.type] || WORKFLOW_STEP_LIBRARY.note;

    svg.appendChild(
      createSvg("rect", {
        x: String(point.x),
        y: String(point.y),
        width: String(cardWidth),
        height: String(cardHeight),
        rx: "18",
        ry: "18",
        fill: "#fdfefe",
        stroke: point.lane.color,
        "stroke-width": "2.2"
      })
    );
    svg.appendChild(
      createSvg("rect", {
        x: String(point.x),
        y: String(point.y),
        width: "12",
        height: String(cardHeight),
        rx: "18",
        ry: "18",
        fill: stepType.accent
      })
    );
    svg.appendChild(
      createSvg("circle", {
        cx: String(point.x + 30),
        cy: String(point.y + 28),
        r: "16",
        fill: stepType.accent
      })
    );
    svg.appendChild(
      createSvg("text", {
        x: String(point.x + 30),
        y: String(point.y + 33),
        "text-anchor": "middle",
        fill: "#ffffff",
        "font-family": "'Chakra Petch', 'IBM Plex Sans', sans-serif",
        "font-size": "16",
        "font-weight": "700"
      }, stepType.icon)
    );
    svg.appendChild(
      createSvg("text", {
        x: String(point.x + cardWidth - 18),
        y: String(point.y + 26),
        "text-anchor": "end",
        fill: "#5d7b98",
        "font-family": "'IBM Plex Mono', Consolas, monospace",
        "font-size": "13",
        "font-weight": "700"
      }, String(index + 1).padStart(2, "0"))
    );

    const pillWidth = Math.max(70, Math.min(136, 22 + (point.tag || stepType.tag).length * 7.2));
    svg.appendChild(
      createSvg("rect", {
        x: String(point.x + 54),
        y: String(point.y + 14),
        width: String(pillWidth),
        height: "24",
        rx: "12",
        ry: "12",
        fill: "#ffffff",
        stroke: stepType.accent,
        "stroke-width": "1.4"
      })
    );
    svg.appendChild(
      createSvg("text", {
        x: String(point.x + 54 + pillWidth / 2),
        y: String(point.y + 30),
        "text-anchor": "middle",
        fill: stepType.accent,
        "font-family": "'IBM Plex Sans', sans-serif",
        "font-size": "12",
        "font-weight": "700"
      }, point.tag || stepType.tag)
    );

    drawSvgTextLines(svg, wrapText(point.title, 22), {
      x: point.x + 54,
      y: point.y + 54,
      fill: "#1d3958",
      fontFamily: "'Chakra Petch', 'IBM Plex Sans', sans-serif",
      fontSize: 17,
      fontWeight: 700,
      lineHeight: 18
    });

    drawSvgTextLines(svg, wrapText(point.detail, 30).slice(0, 2), {
      x: point.x + 54,
      y: point.y + 74,
      fill: "#58718d",
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontSize: 11.8,
      fontWeight: 600,
      lineHeight: 13.8
    });

    if (point.command) {
      svg.appendChild(
        createSvg("text", {
          x: String(point.x + 54),
          y: String(point.y + cardHeight - 10),
          fill: "#5a7390",
          "font-family": "'IBM Plex Mono', Consolas, monospace",
          "font-size": "10.6",
          "font-weight": "600"
        }, `> ${compactCommand(point.command, 26)}`)
      );
    }
  });

  elements.previewCaption.textContent = `${steps.length} step${steps.length === 1 ? "" : "s"} across ${lanes.length} lane${lanes.length === 1 ? "" : "s"}. Export JSON to resume later or export SVG/PNG for the workshop output.`;
}

function drawSvgTextLines(svg, lines, options) {
  lines.forEach((line, index) => {
    svg.appendChild(
      createSvg("text", {
        x: String(options.x),
        y: String(options.y + index * options.lineHeight),
        fill: options.fill,
        "font-family": options.fontFamily,
        "font-size": String(options.fontSize),
        "font-weight": String(options.fontWeight)
      }, line)
    );
  });
}

function wrapText(text, maxChars) {
  if (!text) {
    return [""];
  }
  const words = String(text).trim().split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) {
    lines.push(line);
  }
  return lines;
}

function compactCommand(command, maxChars = 32) {
  const value = String(command || "").trim();
  if (!value) {
    return "No command";
  }
  return value.length > maxChars ? `${value.slice(0, maxChars - 3)}...` : value;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createSvg(tag, attributes = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });
  if (text) {
    node.textContent = text;
  }
  return node;
}

function render() {
  renderWorkflowMeta();
  renderLaneManager();
  renderPalette();
  renderSequenceBoard();
  renderStepEditor();
  renderPreview();
}

function updateStep(stepId, patch) {
  const step = state.steps.find((item) => item.id === stepId);
  if (!step) {
    return;
  }
  Object.assign(step, patch);
  renderSequenceBoard();
  renderPreview();
  scheduleSave();
}

function insertStepAt(index, step) {
  const safeIndex = Math.max(0, Math.min(index, state.steps.length));
  state.steps.splice(safeIndex, 0, step);
  state.selectedStepId = step.id;
  render();
  scheduleSave("Saved locally");
}

function createStepFromType(type, laneId) {
  const libraryStep = WORKFLOW_STEP_LIBRARY[type] || WORKFLOW_STEP_LIBRARY.note;
  return {
    id: nextId("step"),
    type,
    laneId: laneId || state.lanes[0].id,
    title: libraryStep.title,
    tag: libraryStep.tag,
    detail: libraryStep.detail,
    command: libraryStep.command
  };
}

function moveStep(stepId, targetIndex) {
  const currentIndex = state.steps.findIndex((step) => step.id === stepId);
  if (currentIndex === -1) {
    return;
  }
  const [step] = state.steps.splice(currentIndex, 1);
  let nextIndex = targetIndex;
  if (currentIndex < targetIndex) {
    nextIndex -= 1;
  }
  nextIndex = Math.max(0, Math.min(nextIndex, state.steps.length));
  state.steps.splice(nextIndex, 0, step);
  state.selectedStepId = step.id;
  render();
  scheduleSave();
}

function addLane() {
  const lane = {
    id: nextId("lane"),
    name: `Lane ${state.lanes.length + 1}`,
    color: laneColorCycle[state.lanes.length % laneColorCycle.length]
  };
  state.lanes.push(lane);
  render();
  scheduleSave();
}

function moveLane(laneId, direction) {
  const index = state.lanes.findIndex((lane) => lane.id === laneId);
  if (index === -1) {
    return;
  }
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= state.lanes.length) {
    return;
  }
  const [lane] = state.lanes.splice(index, 1);
  state.lanes.splice(nextIndex, 0, lane);
  render();
  scheduleSave();
}

function removeLane(laneId) {
  if (state.lanes.length === 1) {
    return;
  }
  const laneIndex = state.lanes.findIndex((lane) => lane.id === laneId);
  if (laneIndex === -1) {
    return;
  }
  const fallbackLane = state.lanes[laneIndex === 0 ? 1 : 0];
  state.lanes.splice(laneIndex, 1);
  state.steps.forEach((step) => {
    if (step.laneId === laneId) {
      step.laneId = fallbackLane.id;
    }
  });
  render();
  scheduleSave();
}

function duplicateSelectedStep() {
  const step = getSelectedStep();
  if (!step) {
    return;
  }
  const index = state.steps.findIndex((item) => item.id === step.id);
  const copy = {
    ...step,
    id: nextId("step"),
    title: `${step.title} Copy`
  };
  state.steps.splice(index + 1, 0, copy);
  state.selectedStepId = copy.id;
  render();
  scheduleSave();
}

function deleteSelectedStep() {
  const step = getSelectedStep();
  if (!step) {
    return;
  }
  const index = state.steps.findIndex((item) => item.id === step.id);
  state.steps.splice(index, 1);
  state.selectedStepId = state.steps[index]?.id || state.steps[index - 1]?.id || null;
  render();
  scheduleSave();
}

function serializePreviewSvg() {
  const svg = elements.previewSvg.cloneNode(true);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(svg);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  downloadBlob("workflow-builder-session.json", blob);
  setSaveStatus("Exported JSON");
}

function exportSvg() {
  const blob = new Blob([serializePreviewSvg()], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob("workflow-builder-preview.svg", blob);
  setSaveStatus("Exported SVG");
}

async function exportPng() {
  const svgText = serializePreviewSvg();
  const viewBox = elements.previewSvg.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 980, 420];
  const [, , width, height] = viewBox;
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
    image.src = url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(url);
    return;
  }

  context.scale(2, 2);
  context.fillStyle = "#f6f8fb";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  URL.revokeObjectURL(url);
  const pngBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (pngBlob) {
    downloadBlob("workflow-builder-preview.png", pngBlob);
    setSaveStatus("Exported PNG");
  }
}

function loadTemplate(templateId) {
  state = cloneTemplate(templateId);
  render();
  scheduleSave("Template loaded");
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ""));
      state = normalizeWorkflowState(payload);
      render();
      scheduleSave("Imported JSON");
    } catch (_error) {
      setSaveStatus("Import failed");
    }
  };
  reader.readAsText(file);
}

function bindEvents() {
  elements.loadTemplateBtn.addEventListener("click", () => {
    loadTemplate(elements.templateSelect.value);
  });

  elements.resetBtn.addEventListener("click", () => {
    loadTemplate("blank");
  });

  elements.presentBtn.addEventListener("click", () => {
    state.presentMode = !state.presentMode;
    render();
    scheduleSave(state.presentMode ? "Presentation mode on" : "Presentation mode off");
  });

  elements.nameInput.addEventListener("input", () => {
    state.meta.name = elements.nameInput.value.trim() || "Untitled workflow";
    scheduleSave();
  });

  elements.descriptionInput.addEventListener("input", () => {
    state.meta.description = elements.descriptionInput.value;
    scheduleSave();
  });

  elements.addLaneBtn.addEventListener("click", addLane);

  elements.laneList.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    const laneId = target.dataset.laneId;
    const lane = state.lanes.find((item) => item.id === laneId);
    if (!lane) {
      return;
    }
    if (target.classList.contains("workflow-lane-name-input")) {
      lane.name = target.value.trim() || "Lane";
    } else if (target.classList.contains("workflow-lane-color-input")) {
      lane.color = target.value;
    }
    renderSequenceBoard();
    renderStepEditor();
    renderPreview();
    scheduleSave();
  });

  elements.laneList.addEventListener("click", (event) => {
    const button = event.target instanceof HTMLElement ? event.target.closest("[data-lane-action]") : null;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }
    const laneId = button.dataset.laneId;
    const action = button.dataset.laneAction;
    if (action === "up" || action === "down") {
      moveLane(laneId, action);
    } else if (action === "remove") {
      removeLane(laneId);
    }
  });

  elements.palette.addEventListener("dragstart", (event) => {
    const item = event.target instanceof HTMLElement ? event.target.closest(".workflow-palette-item") : null;
    if (!(item instanceof HTMLButtonElement) || !event.dataTransfer) {
      return;
    }
    currentDragPayload = { kind: "library", type: item.dataset.stepType };
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", JSON.stringify(currentDragPayload));
  });

  elements.palette.addEventListener("click", (event) => {
    const item = event.target instanceof HTMLElement ? event.target.closest(".workflow-palette-item") : null;
    if (!(item instanceof HTMLButtonElement)) {
      return;
    }
    insertStepAt(state.steps.length, createStepFromType(item.dataset.stepType, state.lanes[0].id));
  });

  elements.sequence.addEventListener("dragstart", (event) => {
    const card = event.target instanceof HTMLElement ? event.target.closest(".workflow-step-card") : null;
    if (!(card instanceof HTMLElement) || !event.dataTransfer) {
      return;
    }
    currentDragPayload = { kind: "step", stepId: card.dataset.stepId };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(currentDragPayload));
  });

  elements.sequence.addEventListener("dragend", () => {
    elements.sequence.querySelectorAll(".is-drag-target").forEach((node) => node.classList.remove("is-drag-target"));
  });

  elements.sequence.addEventListener("dragover", (event) => {
    const slot = event.target instanceof HTMLElement ? event.target.closest(".workflow-drop-slot") : null;
    if (!slot) {
      return;
    }
    event.preventDefault();
    elements.sequence.querySelectorAll(".is-drag-target").forEach((node) => node.classList.remove("is-drag-target"));
    slot.classList.add("is-drag-target");
  });

  elements.sequence.addEventListener("dragleave", (event) => {
    const slot = event.target instanceof HTMLElement ? event.target.closest(".workflow-drop-slot") : null;
    slot?.classList.remove("is-drag-target");
  });

  elements.sequence.addEventListener("drop", (event) => {
    const slot = event.target instanceof HTMLElement ? event.target.closest(".workflow-drop-slot") : null;
    if (!slot) {
      return;
    }
    event.preventDefault();
    slot.classList.remove("is-drag-target");
    const insertIndex = Number(slot.dataset.insertIndex || state.steps.length);
    if (currentDragPayload?.kind === "library") {
      insertStepAt(insertIndex, createStepFromType(currentDragPayload.type, state.lanes[0].id));
      return;
    }
    if (currentDragPayload?.kind === "step" && currentDragPayload.stepId) {
      moveStep(currentDragPayload.stepId, insertIndex);
    }
  });

  elements.sequence.addEventListener("click", (event) => {
    const card = event.target instanceof HTMLElement ? event.target.closest(".workflow-step-card") : null;
    if (!(card instanceof HTMLElement)) {
      return;
    }
    state.selectedStepId = card.dataset.stepId;
    render();
  });

  elements.sequence.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const card = event.target instanceof HTMLElement ? event.target.closest(".workflow-step-card") : null;
    if (!(card instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    state.selectedStepId = card.dataset.stepId;
    render();
  });

  const syncStepForm = () => {
    const step = getSelectedStep();
    if (!step) {
      return;
    }
    updateStep(step.id, {
      title: elements.stepTitleInput.value.trim() || "Untitled Step",
      type: elements.stepTypeSelect.value,
      laneId: elements.stepLaneSelect.value,
      tag: elements.stepTagInput.value.trim(),
      detail: elements.stepDetailInput.value,
      command: elements.stepCommandInput.value
    });
  };

  elements.stepForm.addEventListener("input", syncStepForm);
  elements.stepForm.addEventListener("change", syncStepForm);

  elements.duplicateStepBtn.addEventListener("click", duplicateSelectedStep);
  elements.deleteStepBtn.addEventListener("click", deleteSelectedStep);

  elements.exportJsonBtn.addEventListener("click", exportJson);
  elements.exportSvgBtn.addEventListener("click", exportSvg);
  elements.exportPngBtn.addEventListener("click", () => {
    exportPng().catch(() => setSaveStatus("PNG export failed"));
  });
  elements.importJsonBtn.addEventListener("click", () => elements.importInput.click());
  elements.importInput.addEventListener("change", () => {
    const file = elements.importInput.files?.[0];
    if (file) {
      importJsonFile(file);
    }
    elements.importInput.value = "";
  });
}

function init() {
  if (!elements.previewSvg) {
    return;
  }

  renderTemplateOptions();
  bindEvents();

  try {
    const saved = window.localStorage.getItem(WORKFLOW_BUILDER_STORAGE_KEY);
    state = saved ? normalizeWorkflowState(JSON.parse(saved)) : cloneTemplate("githubFlow");
    setSaveStatus(saved ? "Loaded local draft" : "Loaded default template");
  } catch (_error) {
    state = cloneTemplate("githubFlow");
    setSaveStatus("Loaded default template");
  }

  render();
}

init();
