(() => {
  const elements = {
    form: document.getElementById("gitCommandForm"),
    commandInput: document.getElementById("gitCommandInput"),
    output: document.getElementById("gitOutput"),
    graph: document.getElementById("gitSimGraph"),
    simulatorSection: document.getElementById("simulatorSection"),
    sectionFullscreenBtn: document.getElementById("simSectionFullscreenBtn"),
    resetBtn: document.getElementById("simResetBtn"),
    zoomRange: document.getElementById("graphZoomRange"),
    zoomValue: document.getElementById("graphZoomValue"),
    branchStateList: document.getElementById("branchStateList"),
    headStateText: document.getElementById("headStateText"),
    chips: Array.from(document.querySelectorAll(".sim-chip")),
    branchInput: document.getElementById("simBranchInput"),
    createBranchBtn: document.getElementById("simCreateBranchBtn"),
    checkoutBranchBtn: document.getElementById("simCheckoutBranchBtn"),
    commitInput: document.getElementById("simCommitInput"),
    commitBtn: document.getElementById("simCommitBtn"),
    mergeInput: document.getElementById("simMergeInput"),
    mergeBtn: document.getElementById("simMergeBtn"),
    revertInput: document.getElementById("simRevertInput"),
    revertBtn: document.getElementById("simRevertBtn")
  };

  if (!elements.form || !elements.graph) {
    return;
  }

  const lanePalette = [
    "#1f4c77",
    "#2f8f83",
    "#b27829",
    "#c04f3f",
    "#557eaa",
    "#7f5aa5",
    "#3f7d4e",
    "#9c4f7c"
  ];

  const STORAGE_KEY = "gbv.gitSimulator.state.v1";

  const state = {
    commits: {},
    commitOrder: [],
    branches: {},
    laneOrder: [],
    branchLanes: {},
    laneColors: {},
    head: {
      branch: "main",
      detached: null
    },
    graphZoom: 1,
    logs: [],
    counter: 0
  };

  const restored = loadPersistedState();
  if (!restored) {
    initializeRepository();
  }
  bindEvents();
  updateZoomDisplay();
  syncFullscreenButton();
  renderAll();

  function initializeRepository() {
    ensureLane("main");
    const rootId = addCommit("Initial repository setup", [], "main");
    state.branches.main = rootId;
    state.head.branch = "main";
    state.head.detached = null;

    writeLog("success", `Repository initialized. main -> ${rootId}`);
    writeLog("info", "Type `help` to see supported commands.");
  }

  function resetRepository() {
    state.commits = {};
    state.commitOrder = [];
    state.branches = {};
    state.laneOrder = [];
    state.branchLanes = {};
    state.laneColors = {};
    state.head.branch = "main";
    state.head.detached = null;
    state.graphZoom = 1;
    state.logs = [];
    state.counter = 0;

    initializeRepository();
    updateZoomDisplay();
  }

  function loadPersistedState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return false;
      }

      const snapshot = JSON.parse(raw);
      if (!isValidSnapshot(snapshot)) {
        window.localStorage.removeItem(STORAGE_KEY);
        return false;
      }

      hydrateState(snapshot.state);
      return true;
    } catch (error) {
      return false;
    }
  }

  function hydrateState(nextState) {
    state.commits = {};
    Object.entries(nextState.commits).forEach(([commitId, commit]) => {
      state.commits[commitId] = {
        id: commit.id,
        message: commit.message,
        parents: [...commit.parents],
        lane: commit.lane
      };
    });

    state.commitOrder = [...nextState.commitOrder];
    state.branches = { ...nextState.branches };
    state.laneOrder = [...nextState.laneOrder];
    state.branchLanes = { ...nextState.branchLanes };
    state.laneColors = { ...nextState.laneColors };
    state.head = {
      branch: nextState.head.branch,
      detached: nextState.head.detached
    };
    state.graphZoom = clamp(Number(nextState.graphZoom) || 1, 0.6, 2.2);
    state.logs = Array.isArray(nextState.logs) ? nextState.logs.slice(-180) : [];
    state.counter = Number(nextState.counter) || 0;

    if (!state.laneOrder.length) {
      state.laneOrder = Object.keys(state.branchLanes).sort((a, b) => state.branchLanes[a] - state.branchLanes[b]);
    }

    state.laneOrder.forEach((laneName, index) => {
      if (!Object.prototype.hasOwnProperty.call(state.laneColors, laneName)) {
        state.laneColors[laneName] = lanePalette[index % lanePalette.length];
      }
    });
  }

  function isValidSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      return false;
    }

    if (snapshot.version !== 1 || !snapshot.state || typeof snapshot.state !== "object") {
      return false;
    }

    const next = snapshot.state;
    if (!next.commits || typeof next.commits !== "object") {
      return false;
    }
    if (!Array.isArray(next.commitOrder) || next.commitOrder.length === 0) {
      return false;
    }
    if (!next.branches || typeof next.branches !== "object") {
      return false;
    }
    if (!next.head || typeof next.head !== "object") {
      return false;
    }
    if (typeof next.counter !== "number" || !Number.isFinite(next.counter)) {
      return false;
    }

    const branchKeys = Object.keys(next.branches);
    if (branchKeys.length === 0) {
      return false;
    }

    for (const commitId of next.commitOrder) {
      const commit = next.commits[commitId];
      if (!commit || typeof commit !== "object") {
        return false;
      }
      if (typeof commit.id !== "string" || commit.id.length === 0) {
        return false;
      }
      if (typeof commit.message !== "string") {
        return false;
      }
      if (!Array.isArray(commit.parents)) {
        return false;
      }
      if (typeof commit.lane !== "string" || commit.lane.length === 0) {
        return false;
      }
    }

    for (const branchName of branchKeys) {
      if (typeof branchName !== "string" || branchName.length === 0) {
        return false;
      }
      const pointer = next.branches[branchName];
      if (typeof pointer !== "string" || !Object.prototype.hasOwnProperty.call(next.commits, pointer)) {
        return false;
      }
    }

    if (next.head.branch !== null && typeof next.head.branch !== "string") {
      return false;
    }
    if (next.head.detached !== null && typeof next.head.detached !== "string") {
      return false;
    }

    if (next.head.branch && !Object.prototype.hasOwnProperty.call(next.branches, next.head.branch)) {
      return false;
    }
    if (next.head.detached && !Object.prototype.hasOwnProperty.call(next.commits, next.head.detached)) {
      return false;
    }

    return true;
  }

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      executeCommand(elements.commandInput.value);
      elements.commandInput.value = "";
    });

    elements.chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const command = chip.dataset.command || "";
        executeCommand(command);
      });
    });

    elements.createBranchBtn.addEventListener("click", () => {
      const branch = elements.branchInput.value.trim();
      if (!branch) {
        return;
      }
      executeCommand(`git branch ${branch}`);
      elements.branchInput.value = "";
    });

    elements.checkoutBranchBtn.addEventListener("click", () => {
      const branch = elements.branchInput.value.trim();
      if (!branch) {
        return;
      }
      executeCommand(`git checkout ${branch}`);
    });

    elements.commitBtn.addEventListener("click", () => {
      const message = elements.commitInput.value.trim();
      if (!message) {
        return;
      }
      const safeMessage = message.replace(/"/g, "'");
      executeCommand(`git commit -m "${safeMessage}"`);
      elements.commitInput.value = "";
    });

    elements.mergeBtn.addEventListener("click", () => {
      const source = elements.mergeInput.value.trim();
      if (!source) {
        return;
      }
      executeCommand(`git merge ${source}`);
      elements.mergeInput.value = "";
    });

    elements.revertBtn.addEventListener("click", () => {
      const commitId = elements.revertInput.value.trim();
      if (!commitId) {
        return;
      }
      executeCommand(`git revert ${commitId}`);
      elements.revertInput.value = "";
    });

    if (elements.zoomRange) {
      elements.zoomRange.addEventListener("input", () => {
        const zoom = clamp(Number(elements.zoomRange.value) / 100, 0.6, 2.2);
        state.graphZoom = zoom;
        updateZoomDisplay();
        renderGraph();
        persistState();
      });
    }

    if (elements.sectionFullscreenBtn) {
      elements.sectionFullscreenBtn.addEventListener("click", toggleSectionFullscreen);
    }

    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Reset Interactive Git Console and clear all branch, commit, and log changes in this simulator?"
        );
        if (!confirmed) {
          return;
        }
        resetRepository();
        renderAll();
      });
    }

    document.addEventListener("fullscreenchange", syncFullscreenButton);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isFallbackFullscreen()) {
        setFallbackFullscreen(false);
      }
    });
  }

  function executeCommand(rawCommand) {
    const command = rawCommand.trim();
    if (!command) {
      return;
    }

    writeLog("command", `$ ${command}`);

    const normalized = command.toLowerCase();
    if (normalized === "help" || normalized === "git help") {
      printHelp();
      renderAll();
      return;
    }

    if (/^sim\s+reset$/i.test(command)) {
      resetRepository();
      renderAll();
      return;
    }

    if (/^git\s+status$/i.test(command)) {
      showStatus();
      renderAll();
      return;
    }

    if (/^git\s+log$/i.test(command)) {
      showLog();
      renderAll();
      return;
    }

    if (/^git\s+branch$/i.test(command)) {
      listBranches();
      renderAll();
      return;
    }

    let match = command.match(/^git\s+checkout\s+-b\s+([A-Za-z0-9._/-]+)$/i);
    if (!match) {
      match = command.match(/^git\s+switch\s+-c\s+([A-Za-z0-9._/-]+)$/i);
    }
    if (match) {
      const name = match[1];
      createBranch(name);
      checkout(name);
      renderAll();
      return;
    }

    match = command.match(/^git\s+branch\s+([A-Za-z0-9._/-]+)$/i);
    if (match) {
      createBranch(match[1]);
      renderAll();
      return;
    }

    match = command.match(/^git\s+checkout\s+([A-Za-z0-9._/-]+)$/i);
    if (!match) {
      match = command.match(/^git\s+switch\s+([A-Za-z0-9._/-]+)$/i);
    }
    if (match) {
      checkout(match[1]);
      renderAll();
      return;
    }

    match = command.match(/^git\s+commit\s+-m\s+(.+)$/i);
    if (match) {
      const message = stripQuotes(match[1].trim());
      if (!message) {
        writeLog("error", "Commit message cannot be empty.");
      } else {
        commit(message);
      }
      renderAll();
      return;
    }

    match = command.match(/^git\s+merge\s+([A-Za-z0-9._/-]+)$/i);
    if (match) {
      merge(match[1]);
      renderAll();
      return;
    }

    match = command.match(/^git\s+revert\s+([A-Za-z0-9]+)$/i);
    if (match) {
      revert(match[1]);
      renderAll();
      return;
    }

    writeLog("error", "Unknown command. Type `help` for supported commands.");
    renderAll();
  }

  function stripQuotes(value) {
    if (value.length >= 2) {
      const startsWithQuote = value.startsWith("\"") || value.startsWith("'");
      const endsWithQuote = value.endsWith("\"") || value.endsWith("'");
      if (startsWithQuote && endsWithQuote) {
        return value.slice(1, -1).trim();
      }
    }
    return value;
  }

  function createBranch(name) {
    if (!/^[A-Za-z0-9._/-]+$/.test(name)) {
      writeLog("error", `Invalid branch name: ${name}`);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(state.branches, name)) {
      writeLog("error", `Branch already exists: ${name}`);
      return;
    }

    const headCommit = getHeadCommitId();
    if (!headCommit) {
      writeLog("error", "Cannot create branch: HEAD has no commit.");
      return;
    }

    ensureLane(name);
    state.branches[name] = headCommit;
    writeLog("success", `Created branch ${name} at ${headCommit}.`);
  }

  function checkout(target) {
    if (Object.prototype.hasOwnProperty.call(state.branches, target)) {
      state.head.branch = target;
      state.head.detached = null;
      writeLog("success", `Switched to branch ${target}.`);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(state.commits, target)) {
      ensureLane("detached");
      state.head.branch = null;
      state.head.detached = target;
      writeLog("info", `HEAD detached at ${target}.`);
      return;
    }

    writeLog("error", `Unknown branch or commit: ${target}`);
  }

  function commit(message) {
    const parentId = getHeadCommitId();
    if (!parentId) {
      writeLog("error", "Cannot commit: no current commit.");
      return;
    }

    const lane = state.head.branch || "detached";
    ensureLane(lane);
    const commitId = addCommit(message, [parentId], lane);

    if (state.head.branch) {
      state.branches[state.head.branch] = commitId;
    } else {
      state.head.detached = commitId;
    }

    writeLog("success", `Committed ${commitId}: ${message}`);
  }

  function merge(sourceBranch) {
    if (!state.head.branch) {
      writeLog("error", "Cannot merge in detached HEAD. Checkout a branch first.");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(state.branches, sourceBranch)) {
      writeLog("error", `Unknown branch: ${sourceBranch}`);
      return;
    }

    const targetBranch = state.head.branch;
    if (sourceBranch === targetBranch) {
      writeLog("error", "Cannot merge a branch into itself.");
      return;
    }

    const sourceTip = state.branches[sourceBranch];
    const targetTip = state.branches[targetBranch];

    if (sourceTip === targetTip) {
      writeLog("info", `${targetBranch} is already up to date with ${sourceBranch}.`);
      return;
    }

    if (isAncestor(targetTip, sourceTip)) {
      state.branches[targetBranch] = sourceTip;
      writeLog("success", `Fast-forward merged ${sourceBranch} into ${targetBranch} at ${sourceTip}.`);
      return;
    }

    if (isAncestor(sourceTip, targetTip)) {
      writeLog("info", `${targetBranch} already contains commits from ${sourceBranch}.`);
      return;
    }

    const mergeMessage = `Merge branch '${sourceBranch}' into ${targetBranch}`;
    const mergeCommitId = addCommit(mergeMessage, [targetTip, sourceTip], targetBranch);
    state.branches[targetBranch] = mergeCommitId;
    writeLog("success", `Merged ${sourceBranch} into ${targetBranch} with commit ${mergeCommitId}.`);
  }

  function revert(commitId) {
    if (!Object.prototype.hasOwnProperty.call(state.commits, commitId)) {
      writeLog("error", `Unknown commit id: ${commitId}`);
      return;
    }

    if (!state.head.branch) {
      writeLog("error", "Cannot revert in detached HEAD. Checkout a branch first.");
      return;
    }

    const parentId = getHeadCommitId();
    const message = `Revert ${commitId}`;
    const revertCommitId = addCommit(message, [parentId], state.head.branch);
    state.branches[state.head.branch] = revertCommitId;
    writeLog("success", `Created revert commit ${revertCommitId} for ${commitId}.`);
  }

  function showStatus() {
    const current = getHeadCommitId() || "none";
    if (state.head.branch) {
      writeLog("info", `On branch ${state.head.branch}`);
    } else {
      writeLog("info", "HEAD detached");
    }
    writeLog("info", `Current commit: ${current}`);
    writeLog("info", `Total commits: ${state.commitOrder.length}`);
  }

  function listBranches() {
    const sorted = getSortedBranchNames();
    sorted.forEach((branchName) => {
      const marker = state.head.branch === branchName ? "*" : " ";
      writeLog("info", `${marker} ${branchName} -> ${state.branches[branchName]}`);
    });
  }

  function showLog() {
    const recentCommits = [...state.commitOrder].reverse().slice(0, 16);
    recentCommits.forEach((commitId) => {
      const commit = state.commits[commitId];
      const pointers = getPointersForCommit(commitId)
        .map((pointer) => pointer.label)
        .join(", ");
      const pointerText = pointers ? ` (${pointers})` : "";
      writeLog("info", `${commitId}${pointerText} ${commit.message}`);
    });
  }

  function printHelp() {
    writeLog("info", "Commands:");
    writeLog("info", "  git branch <name>");
    writeLog("info", "  git checkout -b <name>");
    writeLog("info", "  git checkout <branch>");
    writeLog("info", "  git commit -m \"message\"");
    writeLog("info", "  git merge <branch>");
    writeLog("info", "  git revert <commitId>");
    writeLog("info", "  git log");
    writeLog("info", "  git status");
    writeLog("info", "  sim reset");
  }

  function addCommit(message, parents, lane) {
    const id = nextCommitId();
    state.commits[id] = {
      id,
      message,
      parents,
      lane
    };
    state.commitOrder.push(id);
    return id;
  }

  function nextCommitId() {
    while (true) {
      state.counter += 1;
      const hashed = ((state.counter * 2654435761) >>> 0).toString(16).padStart(8, "0");
      const id = hashed.slice(0, 7);
      if (!Object.prototype.hasOwnProperty.call(state.commits, id)) {
        return id;
      }
    }
  }

  function getHeadCommitId() {
    if (state.head.branch) {
      return state.branches[state.head.branch];
    }
    return state.head.detached;
  }

  function isAncestor(ancestorId, descendantId) {
    if (ancestorId === descendantId) {
      return true;
    }

    const visited = new Set();
    const stack = [descendantId];
    while (stack.length) {
      const current = stack.pop();
      if (!current || visited.has(current)) {
        continue;
      }
      if (current === ancestorId) {
        return true;
      }
      visited.add(current);
      const commit = state.commits[current];
      if (commit) {
        stack.push(...commit.parents);
      }
    }

    return false;
  }

  function ensureLane(name) {
    if (Object.prototype.hasOwnProperty.call(state.branchLanes, name)) {
      return;
    }
    const index = state.laneOrder.length;
    state.branchLanes[name] = index;
    state.laneOrder.push(name);
    state.laneColors[name] = lanePalette[index % lanePalette.length];
  }

  function writeLog(kind, text) {
    state.logs.push({ kind, text });
    if (state.logs.length > 180) {
      state.logs.shift();
    }
  }

  function persistState() {
    try {
      const snapshot = {
        version: 1,
        state: {
          commits: state.commits,
          commitOrder: state.commitOrder,
          branches: state.branches,
          laneOrder: state.laneOrder,
          branchLanes: state.branchLanes,
          laneColors: state.laneColors,
          head: state.head,
          graphZoom: state.graphZoom,
          logs: state.logs,
          counter: state.counter
        }
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      // Ignore storage failures (private mode/quota) and keep simulator functional.
    }
  }

  function renderAll() {
    renderOutput();
    renderState();
    renderGraph();
    persistState();
  }

  function renderOutput() {
    elements.output.textContent = "";
    state.logs.forEach((entry) => {
      const line = document.createElement("div");
      line.className = `log-line ${entry.kind}`;
      line.textContent = entry.text;
      elements.output.appendChild(line);
    });
    scrollOutputToBottom();
  }

  function scrollOutputToBottom() {
    elements.output.scrollTop = elements.output.scrollHeight;
    window.requestAnimationFrame(() => {
      elements.output.scrollTop = elements.output.scrollHeight;
    });
  }

  function renderState() {
    const branchNames = getSortedBranchNames();
    elements.branchStateList.textContent = "";

    branchNames.forEach((branchName) => {
      const item = document.createElement("li");
      const pointer = state.branches[branchName];
      const isHead = state.head.branch === branchName;
      item.textContent = `${branchName} -> ${pointer}${isHead ? " (HEAD)" : ""}`;
      if (isHead) {
        item.classList.add("sim-branch-head");
      }
      elements.branchStateList.appendChild(item);
    });

    if (state.head.branch) {
      elements.headStateText.textContent = `HEAD points to branch ${state.head.branch} at ${state.branches[state.head.branch]}.`;
    } else {
      elements.headStateText.textContent = `HEAD detached at ${state.head.detached || "none"}.`;
    }
  }

  function getSortedBranchNames() {
    return Object.keys(state.branches).sort(
      (a, b) => (state.branchLanes[a] ?? Number.MAX_SAFE_INTEGER) - (state.branchLanes[b] ?? Number.MAX_SAFE_INTEGER)
    );
  }

  function renderGraph() {
    const svg = elements.graph;
    svg.textContent = "";

    const laneNames = getVisibleLanes();
    const laneGap = 74;
    const left = 150;
    const top = 56;
    const xGap = 96;
    const rightPadding = 240;
    const bottomPadding = 88;
    const commitIds = state.commitOrder;

    const width = Math.max(920, left + Math.max(0, commitIds.length - 1) * xGap + rightPadding);
    const height = Math.max(260, top + Math.max(0, laneNames.length - 1) * laneGap + bottomPadding);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
    const zoom = clamp(state.graphZoom || 1, 0.6, 2.2);
    svg.style.width = `${Math.round(width * zoom)}px`;
    svg.style.height = `${Math.round(height * zoom)}px`;

    svg.appendChild(createArrowDefinition());

    const laneY = new Map();
    laneNames.forEach((laneName, index) => {
      const y = top + index * laneGap;
      laneY.set(laneName, y);

      const line = createSvgElement("line", {
        x1: left - 8,
        y1: y,
        x2: width - 32,
        y2: y,
        stroke: getLaneColor(laneName),
        class: "sim-lane-line"
      });
      const label = createSvgElement("text", {
        x: 14,
        y: y + 4,
        class: "sim-lane-label"
      });
      label.textContent = laneName;

      svg.appendChild(line);
      svg.appendChild(label);
    });

    const positions = new Map();
    commitIds.forEach((commitId, index) => {
      const commit = state.commits[commitId];
      const x = left + index * xGap;
      const y = laneY.get(commit.lane) ?? top;
      positions.set(commitId, { x, y, commit });
    });

    const nodeRadius = 13;
    commitIds.forEach((commitId) => {
      const child = positions.get(commitId);
      child.commit.parents.forEach((parentId, parentIndex) => {
        const parent = positions.get(parentId);
        if (!parent) {
          return;
        }

        const dx = child.x - parent.x;
        const dy = child.y - parent.y;
        const distance = Math.hypot(dx, dy) || 1;
        const ux = dx / distance;
        const uy = dy / distance;
        const padding = distance > 8 ? Math.min(nodeRadius + 2, distance / 2 - 1) : 0;

        const edge = createSvgElement("line", {
          x1: parent.x + ux * padding,
          y1: parent.y + uy * padding,
          x2: child.x - ux * padding,
          y2: child.y - uy * padding,
          stroke: getLaneColor(child.commit.lane),
          class: parentIndex === 1 ? "sim-edge merge-parent" : "sim-edge"
        });
        svg.appendChild(edge);
      });
    });

    commitIds.forEach((commitId) => {
      const point = positions.get(commitId);
      const isHead = getHeadCommitId() === commitId;

      const node = createSvgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: nodeRadius,
        fill: getLaneColor(point.commit.lane),
        class: isHead ? "sim-node sim-node-highlight" : "sim-node"
      });
      const tooltip = createSvgElement("title");
      tooltip.textContent = `${commitId}: ${point.commit.message}`;
      node.appendChild(tooltip);

      const idTextValue = commitId.slice(0, 7);
      const idBadgeWidth = idTextValue.length * 7 + 14;
      const idBadgeY = point.y + nodeRadius + 8;
      const idBadge = createSvgElement("rect", {
        x: point.x - idBadgeWidth / 2,
        y: idBadgeY,
        width: idBadgeWidth,
        height: 16,
        rx: 6,
        ry: 6,
        class: isHead ? "sim-commit-id-badge head" : "sim-commit-id-badge"
      });

      const idLabel = createSvgElement("text", {
        x: point.x,
        y: idBadgeY + 8.5,
        class: "sim-commit-id-text"
      });
      idLabel.textContent = idTextValue;

      svg.appendChild(node);
      svg.appendChild(idBadge);
      svg.appendChild(idLabel);
    });

    const pointerMap = new Map();
    Object.keys(state.branches).forEach((branchName) => {
      const commitId = state.branches[branchName];
      const pointerLabel = state.head.branch === branchName ? `${branchName} (HEAD)` : branchName;
      const pointers = pointerMap.get(commitId) || [];
      pointers.push({
        label: pointerLabel,
        lane: branchName,
        isHead: state.head.branch === branchName
      });
      pointerMap.set(commitId, pointers);
    });

    if (!state.head.branch && state.head.detached) {
      const detachedPointers = pointerMap.get(state.head.detached) || [];
      detachedPointers.push({
        label: "HEAD (detached)",
        lane: "detached",
        isHead: true
      });
      pointerMap.set(state.head.detached, detachedPointers);
    }

    pointerMap.forEach((pointers, commitId) => {
      const point = positions.get(commitId);
      if (!point) {
        return;
      }

      pointers.forEach((pointer, index) => {
        const labelX = point.x + 18;
        const labelY = point.y - 20 - index * 18;
        const labelWidth = pointer.label.length * 6.2 + 14;
        const fillColor = pointer.isHead ? "#133c66" : getLaneColor(pointer.lane);

        const badge = createSvgElement("rect", {
          x: labelX,
          y: labelY - 11,
          width: labelWidth,
          height: 15,
          rx: 5,
          ry: 5,
          fill: fillColor,
          opacity: "0.95"
        });
        const text = createSvgElement("text", {
          x: labelX + 7,
          y: labelY,
          class: "sim-pointer-text"
        });
        text.textContent = pointer.label;

        svg.appendChild(badge);
        svg.appendChild(text);
      });
    });
  }

  function getVisibleLanes() {
    return state.laneOrder.filter((laneName) => {
      if (laneName === "detached") {
        return !state.head.branch || state.commitOrder.some((id) => state.commits[id].lane === "detached");
      }
      if (Object.prototype.hasOwnProperty.call(state.branches, laneName)) {
        return true;
      }
      return state.commitOrder.some((id) => state.commits[id].lane === laneName);
    });
  }

  function getLaneColor(laneName) {
    return state.laneColors[laneName] || "#557eaa";
  }

  function getPointersForCommit(commitId) {
    const pointers = [];
    Object.keys(state.branches).forEach((branchName) => {
      if (state.branches[branchName] === commitId) {
        pointers.push({
          label: state.head.branch === branchName ? `${branchName} (HEAD)` : branchName
        });
      }
    });
    if (!state.head.branch && state.head.detached === commitId) {
      pointers.push({ label: "HEAD (detached)" });
    }
    return pointers;
  }

  function createArrowDefinition() {
    const defs = createSvgElement("defs");
    const marker = createSvgElement("marker", {
      id: "simArrow",
      viewBox: "0 0 10 10",
      refX: "9",
      refY: "5",
      markerWidth: "6",
      markerHeight: "6",
      orient: "auto-start-reverse"
    });
    const arrow = createSvgElement("path", {
      d: "M 0 0 L 10 5 L 0 10 z",
      fill: "#2f5574"
    });
    marker.appendChild(arrow);
    defs.appendChild(marker);
    return defs;
  }

  function createSvgElement(type, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", type);
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
    return element;
  }

  function updateZoomDisplay() {
    if (!elements.zoomValue || !elements.zoomRange) {
      return;
    }
    const percent = Math.round(clamp(state.graphZoom || 1, 0.6, 2.2) * 100);
    elements.zoomRange.value = String(percent);
    elements.zoomValue.textContent = `${percent}%`;
  }

  function toggleSectionFullscreen() {
    if (!elements.simulatorSection) {
      return;
    }

    if (isFallbackFullscreen()) {
      setFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement === elements.simulatorSection) {
      document.exitFullscreen().catch(() => {
        setFallbackFullscreen(false);
      });
      return;
    }

    const requestFullscreen = elements.simulatorSection.requestFullscreen;
    if (typeof requestFullscreen === "function") {
      requestFullscreen.call(elements.simulatorSection).catch(() => {
        setFallbackFullscreen(true);
      });
      return;
    }

    setFallbackFullscreen(true);
  }

  function isFallbackFullscreen() {
    return Boolean(elements.simulatorSection && elements.simulatorSection.classList.contains("simulator-fallback-fullscreen"));
  }

  function setFallbackFullscreen(enabled) {
    if (!elements.simulatorSection) {
      return;
    }
    elements.simulatorSection.classList.toggle("simulator-fallback-fullscreen", enabled);
    document.body.classList.toggle("sim-body-lock", enabled);
    syncFullscreenButton();
  }

  function syncFullscreenButton() {
    if (!elements.sectionFullscreenBtn || !elements.simulatorSection) {
      return;
    }
    const active = document.fullscreenElement === elements.simulatorSection || isFallbackFullscreen();
    elements.sectionFullscreenBtn.textContent = active ? "Exit Full Screen" : "Full Screen";
    elements.sectionFullscreenBtn.setAttribute("aria-pressed", String(active));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
