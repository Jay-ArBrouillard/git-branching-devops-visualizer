(() => {
  const elements = {
    form: document.getElementById("conflictCommandForm"),
    input: document.getElementById("conflictCommandInput"),
    output: document.getElementById("conflictOutput"),
    simulatorSection: document.getElementById("conflictSimulatorSection"),
    sectionFullscreenBtn: document.getElementById("conflictSectionFullscreenBtn"),
    chips: Array.from(document.querySelectorAll("[data-conflict-command]")),
    baseView: document.getElementById("conflictBaseView"),
    oursView: document.getElementById("conflictOursView"),
    theirsView: document.getElementById("conflictTheirsView"),
    mergeView: document.getElementById("conflictMergeView"),
    statusBadge: document.getElementById("conflictStatusBadge"),
    statusText: document.getElementById("conflictStatusText"),
    branchList: document.getElementById("conflictBranchList"),
    headText: document.getElementById("conflictHeadText"),
    commitList: document.getElementById("conflictCommitList"),
    resetBtn: document.getElementById("conflictResetBtn")
  };

  if (!elements.form || !elements.input || !elements.output) {
    return;
  }

  const STORAGE_KEY = "gbv.mergeConflictSimulator.state.v1";

  const state = {
    commits: {},
    commitOrder: [],
    branches: {},
    currentBranch: "main",
    workingLines: [],
    merge: null,
    logs: [],
    counter: 0
  };

  if (!loadState()) {
    resetRepository();
  } else {
    writeLog("info", "Restored merge conflict simulator session.");
  }

  bindEvents();
  syncFullscreenButton();
  renderAll();

  function bindEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      executeCommand(elements.input.value);
      elements.input.value = "";
    });

    elements.chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const command = chip.dataset.conflictCommand || "";
        executeCommand(command);
      });
    });

    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", () => {
        const confirmed = window.confirm(
          "Reset Merge Conflict Simulator and clear all branch, conflict, and log changes in this simulator?"
        );
        if (!confirmed) {
          return;
        }
        resetRepository();
        renderAll();
      });
    }

    if (elements.sectionFullscreenBtn) {
      elements.sectionFullscreenBtn.addEventListener("click", toggleSectionFullscreen);
    }

    document.addEventListener("fullscreenchange", syncFullscreenButton);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isFallbackFullscreen()) {
        setFallbackFullscreen(false);
      }
    });
  }

  function executeCommand(raw) {
    const command = raw.trim();
    if (!command) {
      return;
    }

    writeLog("command", `$ ${command}`);

    if (/^(help|git help)$/i.test(command)) {
      printHelp();
      renderAll();
      return;
    }

    if (/^sim\s+reset$/i.test(command)) {
      resetRepository();
      renderAll();
      return;
    }

    if (/^sim\s+seed-conflict$/i.test(command)) {
      seedConflictScenario();
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
    if (match) {
      createBranch(match[1]);
      checkout(match[1]);
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
    if (match) {
      checkout(match[1]);
      renderAll();
      return;
    }

    match = command.match(/^git\s+edit\s+(\d+)\s+(.+)$/i);
    if (match) {
      editLine(Number(match[1]), stripQuotes(match[2]));
      renderAll();
      return;
    }

    match = command.match(/^git\s+commit\s+-m\s+(.+)$/i);
    if (match) {
      commit(stripQuotes(match[1]));
      renderAll();
      return;
    }

    match = command.match(/^git\s+merge\s+([A-Za-z0-9._/-]+)$/i);
    if (match) {
      mergeBranch(match[1]);
      renderAll();
      return;
    }

    match = command.match(/^sim\s+resolve\s+(ours|theirs|both)$/i);
    if (match) {
      resolveConflict(match[1].toLowerCase());
      renderAll();
      return;
    }

    if (/^git\s+add\s+app\.txt$/i.test(command)) {
      stageResolution();
      renderAll();
      return;
    }

    writeLog("error", "Unknown command. Type `help` for supported commands.");
    renderAll();
  }

  function resetRepository() {
    state.commits = {};
    state.commitOrder = [];
    state.branches = {};
    state.currentBranch = "main";
    state.merge = null;
    state.logs = [];
    state.counter = 0;

    const initialLines = ["title=Checkout", "button=Pay now", "footer=Thank you"];
    const rootId = addCommit("Initial checkout template", [], initialLines, "main");
    state.branches.main = rootId;
    state.workingLines = cloneLines(initialLines);

    writeLog("success", `Simulator reset. main -> ${rootId}`);
    writeLog("info", "Run `sim seed-conflict` to prepare a conflict scenario.");
  }

  function seedConflictScenario() {
    resetRepository();
    createBranch("feature/cart");
    checkout("feature/cart");
    editLine(2, "button=Complete purchase");
    commit("feat: improve checkout CTA");
    checkout("main");
    editLine(2, "button=Pay securely");
    commit("feat: tighten security wording");
    writeLog("info", "Ready. Run `git merge feature/cart` on main to trigger a merge conflict.");
  }

  function createBranch(name) {
    if (!isValidBranchName(name)) {
      writeLog("error", `Invalid branch name: ${name}`);
      return;
    }
    if (state.merge) {
      writeLog("error", "Cannot create a branch during an active merge conflict.");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(state.branches, name)) {
      writeLog("error", `Branch already exists: ${name}`);
      return;
    }
    state.branches[name] = currentCommitId();
    writeLog("success", `Created branch ${name} at ${state.branches[name]}.`);
  }

  function checkout(name) {
    if (state.merge) {
      writeLog("error", "Cannot checkout during an active merge conflict.");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(state.branches, name)) {
      writeLog("error", `Unknown branch: ${name}`);
      return;
    }
    state.currentBranch = name;
    state.workingLines = cloneLines(commitLines(state.branches[name]));
    writeLog("success", `Switched to branch ${name}.`);
  }

  function editLine(lineNumber, text) {
    if (state.merge && !state.merge.resolvedLines) {
      writeLog("error", "Resolve merge conflict first (`sim resolve ours|theirs|both`).");
      return;
    }
    if (!Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > 30) {
      writeLog("error", "Line number must be between 1 and 30.");
      return;
    }
    const safeText = (text || "").trim();
    if (!safeText) {
      writeLog("error", "Edited line cannot be empty.");
      return;
    }

    while (state.workingLines.length < lineNumber) {
      state.workingLines.push("");
    }
    state.workingLines[lineNumber - 1] = safeText;
    writeLog("success", `Edited app.txt line ${lineNumber}.`);

    if (state.merge) {
      state.merge.resolvedLines = cloneLines(state.workingLines);
      state.merge.staged = false;
    }
  }

  function commit(message) {
    const safeMessage = (message || "").trim();
    if (!safeMessage) {
      writeLog("error", "Commit message cannot be empty.");
      return;
    }

    if (state.merge) {
      if (!state.merge.resolvedLines) {
        writeLog("error", "Unresolved conflict. Use `sim resolve ours|theirs|both` first.");
        return;
      }
      if (!state.merge.staged) {
        writeLog("error", "Resolved file not staged. Run `git add app.txt`.");
        return;
      }

      const mergedLines = cloneLines(state.merge.resolvedLines);
      const mergeCommitId = addCommit(
        safeMessage,
        [state.merge.targetTip, state.merge.sourceTip],
        mergedLines,
        state.currentBranch
      );
      state.branches[state.currentBranch] = mergeCommitId;
      state.workingLines = mergedLines;
      state.merge = null;
      writeLog("success", `Created merge commit ${mergeCommitId}.`);
      return;
    }

    const tipId = currentCommitId();
    const baseLines = commitLines(tipId);
    if (linesEqual(baseLines, state.workingLines)) {
      writeLog("error", "No changes to commit.");
      return;
    }

    const commitId = addCommit(safeMessage, [tipId], cloneLines(state.workingLines), state.currentBranch);
    state.branches[state.currentBranch] = commitId;
    writeLog("success", `Committed ${commitId}: ${safeMessage}`);
  }

  function mergeBranch(sourceBranch) {
    if (state.merge) {
      writeLog("error", "Merge already in progress.");
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(state.branches, sourceBranch)) {
      writeLog("error", `Unknown branch: ${sourceBranch}`);
      return;
    }
    if (sourceBranch === state.currentBranch) {
      writeLog("error", "Cannot merge a branch into itself.");
      return;
    }

    const targetBranch = state.currentBranch;
    const targetTip = state.branches[targetBranch];
    const sourceTip = state.branches[sourceBranch];

    if (targetTip === sourceTip) {
      writeLog("info", `${targetBranch} already contains ${sourceBranch}.`);
      return;
    }

    const baseTip = findMergeBase(targetTip, sourceTip);
    const baseLines = commitLines(baseTip || targetTip);
    const oursLines = commitLines(targetTip);
    const theirsLines = commitLines(sourceTip);

    const mergeResult = computeLineMerge(baseLines, oursLines, theirsLines, targetBranch, sourceBranch);
    if (!mergeResult.conflicts.length) {
      const mergeCommitId = addCommit(
        `Merge branch '${sourceBranch}' into ${targetBranch}`,
        [targetTip, sourceTip],
        mergeResult.autoLines,
        targetBranch
      );
      state.branches[targetBranch] = mergeCommitId;
      state.workingLines = cloneLines(mergeResult.autoLines);
      writeLog("success", `Merged ${sourceBranch} into ${targetBranch} with commit ${mergeCommitId}.`);
      return;
    }

    state.merge = {
      sourceBranch,
      targetBranch,
      sourceTip,
      targetTip,
      baseTip: baseTip || targetTip,
      baseLines,
      oursLines,
      theirsLines,
      autoLines: mergeResult.autoLines,
      markerLines: mergeResult.markerLines,
      conflicts: mergeResult.conflicts,
      resolvedLines: null,
      staged: false
    };

    writeLog("error", `Merge conflict in app.txt (${mergeResult.conflicts.length} line conflict${mergeResult.conflicts.length > 1 ? "s" : ""}).`);
    writeLog("info", "Resolve with `sim resolve ours`, `sim resolve theirs`, or `sim resolve both`.");
  }

  function resolveConflict(strategy) {
    if (!state.merge) {
      writeLog("error", "No active merge conflict to resolve.");
      return;
    }

    const resolved = cloneLines(state.merge.autoLines);
    state.merge.conflicts.forEach((entry) => {
      if (strategy === "ours") {
        resolved[entry.index] = entry.ours;
      } else if (strategy === "theirs") {
        resolved[entry.index] = entry.theirs;
      } else {
        const ours = entry.ours || "(empty)";
        const theirs = entry.theirs || "(empty)";
        resolved[entry.index] = `${ours} // ${theirs}`;
      }
    });

    state.merge.resolvedLines = resolved;
    state.merge.staged = false;
    state.workingLines = cloneLines(resolved);
    writeLog("success", `Applied conflict strategy: ${strategy}.`);
    writeLog("info", "Run `git add app.txt` then `git commit -m \"merge: ...\"`.");
  }

  function stageResolution() {
    if (!state.merge) {
      writeLog("info", "No merge in progress. Staging skipped in this simulator.");
      return;
    }
    if (!state.merge.resolvedLines) {
      writeLog("error", "Resolve conflict before staging.");
      return;
    }
    state.merge.resolvedLines = cloneLines(state.workingLines);
    state.merge.staged = true;
    writeLog("success", "Staged resolved app.txt.");
  }

  function showStatus() {
    writeLog("info", `On branch ${state.currentBranch}`);
    writeLog("info", `HEAD -> ${state.branches[state.currentBranch]}`);

    if (state.merge && !state.merge.resolvedLines) {
      writeLog("error", "You have unmerged paths: both modified: app.txt");
      return;
    }
    if (state.merge && state.merge.resolvedLines && !state.merge.staged) {
      writeLog("info", "Conflict resolved but not staged. Run `git add app.txt`.");
      return;
    }
    if (state.merge && state.merge.staged) {
      writeLog("info", "All conflicts fixed, ready to commit merge.");
      return;
    }

    const dirty = !linesEqual(state.workingLines, commitLines(state.branches[state.currentBranch]));
    writeLog("info", dirty ? "Working tree has local modifications to app.txt." : "Working tree clean.");
  }

  function showLog() {
    const recent = [...state.commitOrder].reverse().slice(0, 12);
    recent.forEach((commitId) => {
      const commit = state.commits[commitId];
      const labels = pointerLabels(commitId).join(", ");
      const labelText = labels ? ` (${labels})` : "";
      writeLog("info", `${commitId}${labelText} ${commit.message}`);
    });
  }

  function listBranches() {
    sortedBranches().forEach((branchName) => {
      const marker = branchName === state.currentBranch ? "*" : " ";
      writeLog("info", `${marker} ${branchName} -> ${state.branches[branchName]}`);
    });
  }

  function printHelp() {
    writeLog("info", "Commands:");
    writeLog("info", "  sim seed-conflict");
    writeLog("info", "  sim reset");
    writeLog("info", "  git branch <name>");
    writeLog("info", "  git checkout <branch>");
    writeLog("info", "  git checkout -b <name>");
    writeLog("info", "  git edit <line> \"text\"");
    writeLog("info", "  git commit -m \"message\"");
    writeLog("info", "  git merge <branch>");
    writeLog("info", "  sim resolve ours|theirs|both");
    writeLog("info", "  git add app.txt");
    writeLog("info", "  git status");
    writeLog("info", "  git log");
  }

  function computeLineMerge(base, ours, theirs, targetBranch, sourceBranch) {
    const maxLength = Math.max(base.length, ours.length, theirs.length);
    const autoLines = [];
    const markerLines = [];
    const conflicts = [];

    for (let i = 0; i < maxLength; i += 1) {
      const baseLine = base[i] ?? "";
      const ourLine = ours[i] ?? "";
      const theirLine = theirs[i] ?? "";
      const oursChanged = ourLine !== baseLine;
      const theirsChanged = theirLine !== baseLine;

      if (oursChanged && theirsChanged && ourLine !== theirLine) {
        conflicts.push({
          index: i,
          base: baseLine,
          ours: ourLine,
          theirs: theirLine
        });
        autoLines.push(ourLine);
        markerLines.push(`<<<<<<< ${targetBranch}`);
        markerLines.push(ourLine || "(empty)");
        markerLines.push("=======");
        markerLines.push(theirLine || "(empty)");
        markerLines.push(`>>>>>>> ${sourceBranch}`);
        continue;
      }

      let merged = ourLine;
      if (theirsChanged && !oursChanged) {
        merged = theirLine;
      }
      autoLines.push(merged);
      markerLines.push(merged || "");
    }

    return { autoLines, markerLines, conflicts };
  }

  function findMergeBase(leftCommitId, rightCommitId) {
    const leftDistances = ancestorDistances(leftCommitId);
    const rightDistances = ancestorDistances(rightCommitId);

    let bestId = null;
    let bestScore = Number.MAX_SAFE_INTEGER;
    leftDistances.forEach((leftDistance, commitId) => {
      if (!rightDistances.has(commitId)) {
        return;
      }
      const score = leftDistance + rightDistances.get(commitId);
      if (score < bestScore) {
        bestScore = score;
        bestId = commitId;
      }
    });

    return bestId;
  }

  function ancestorDistances(startId) {
    const distances = new Map();
    const queue = [{ id: startId, distance: 0 }];

    while (queue.length) {
      const item = queue.shift();
      if (!item || distances.has(item.id)) {
        continue;
      }
      distances.set(item.id, item.distance);
      const commit = state.commits[item.id];
      if (!commit) {
        continue;
      }
      commit.parents.forEach((parentId) => {
        queue.push({ id: parentId, distance: item.distance + 1 });
      });
    }

    return distances;
  }

  function renderAll() {
    renderOutput();
    renderViews();
    renderState();
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

  function renderViews() {
    const currentTip = state.branches[state.currentBranch];
    const currentLines = commitLines(currentTip);

    if (!state.merge) {
      const featureTip = state.branches["feature/cart"] ? commitLines(state.branches["feature/cart"]) : currentLines;
      elements.baseView.textContent = formatFileLines(currentLines);
      elements.oursView.textContent = formatFileLines(state.workingLines);
      elements.theirsView.textContent = formatFileLines(featureTip);
      elements.mergeView.textContent = formatFileLines(state.workingLines);
      setStatusBadge("clean", "Clean");
      elements.statusText.textContent = "No merge in progress. Use `sim seed-conflict` then `git merge feature/cart`.";
      return;
    }

    elements.baseView.textContent = formatFileLines(state.merge.baseLines);
    elements.oursView.textContent = formatFileLines(state.merge.oursLines);
    elements.theirsView.textContent = formatFileLines(state.merge.theirsLines);

    if (!state.merge.resolvedLines) {
      elements.mergeView.textContent = formatMarkerLines(state.merge.markerLines);
      setStatusBadge("conflict", "Conflict");
      elements.statusText.textContent = `Conflict on ${state.merge.conflicts.length} line(s). Resolve and stage the file.`;
      return;
    }

    elements.mergeView.textContent = formatFileLines(state.merge.resolvedLines);
    if (state.merge.staged) {
      setStatusBadge("staged", "Staged");
      elements.statusText.textContent = "Conflict resolved and staged. Commit the merge to finish.";
    } else {
      setStatusBadge("resolved", "Resolved");
      elements.statusText.textContent = "Conflict resolved. Run `git add app.txt` then commit.";
    }
  }

  function renderState() {
    elements.branchList.textContent = "";
    sortedBranches().forEach((branchName) => {
      const li = document.createElement("li");
      const marker = branchName === state.currentBranch ? " (HEAD)" : "";
      li.textContent = `${branchName} -> ${state.branches[branchName]}${marker}`;
      if (branchName === state.currentBranch) {
        li.classList.add("sim-branch-head");
      }
      elements.branchList.appendChild(li);
    });
    elements.headText.textContent = `HEAD points to ${state.currentBranch} at ${state.branches[state.currentBranch]}.`;

    elements.commitList.textContent = "";
    [...state.commitOrder]
      .reverse()
      .slice(0, 10)
      .forEach((commitId) => {
        const li = document.createElement("li");
        const labels = pointerLabels(commitId);
        const labelText = labels.length ? ` [${labels.join(", ")}]` : "";
        li.textContent = `${commitId}${labelText} ${state.commits[commitId].message}`;
        elements.commitList.appendChild(li);
      });
  }

  function setStatusBadge(mode, text) {
    elements.statusBadge.textContent = text;
    elements.statusBadge.classList.remove("clean", "conflict", "resolved", "staged");
    elements.statusBadge.classList.add(mode);
  }

  function formatFileLines(lines) {
    const safeLines = lines.length ? lines : [""];
    return safeLines.map((line, index) => `${String(index + 1).padStart(2, "0")} | ${line}`).join("\n");
  }

  function formatMarkerLines(lines) {
    const safeLines = lines.length ? lines : [""];
    return safeLines.map((line, index) => `${String(index + 1).padStart(2, "0")} | ${line}`).join("\n");
  }

  function pointerLabels(commitId) {
    const labels = [];
    sortedBranches().forEach((branchName) => {
      if (state.branches[branchName] === commitId) {
        labels.push(branchName === state.currentBranch ? `${branchName} (HEAD)` : branchName);
      }
    });
    return labels;
  }

  function addCommit(message, parents, lines, branch) {
    const commitId = nextCommitId();
    state.commits[commitId] = {
      id: commitId,
      message,
      parents: [...parents],
      lines: cloneLines(lines),
      branch
    };
    state.commitOrder.push(commitId);
    return commitId;
  }

  function commitLines(commitId) {
    const commit = state.commits[commitId];
    return cloneLines(commit ? commit.lines : []);
  }

  function currentCommitId() {
    return state.branches[state.currentBranch];
  }

  function writeLog(kind, text) {
    state.logs.push({ kind, text });
    if (state.logs.length > 220) {
      state.logs.shift();
    }
  }

  function sortedBranches() {
    return Object.keys(state.branches).sort((a, b) => a.localeCompare(b));
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

  function cloneLines(lines) {
    return Array.isArray(lines) ? lines.slice() : [];
  }

  function linesEqual(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  function stripQuotes(value) {
    const raw = (value || "").trim();
    if (raw.length >= 2) {
      const startsWithQuote = raw.startsWith("\"") || raw.startsWith("'");
      const endsWithQuote = raw.endsWith("\"") || raw.endsWith("'");
      if (startsWithQuote && endsWithQuote) {
        return raw.slice(1, -1).trim();
      }
    }
    return raw;
  }

  function isValidBranchName(name) {
    return /^[A-Za-z0-9._/-]+$/.test(name);
  }

  function persistState() {
    try {
      const snapshot = {
        version: 1,
        state: {
          commits: state.commits,
          commitOrder: state.commitOrder,
          branches: state.branches,
          currentBranch: state.currentBranch,
          workingLines: state.workingLines,
          merge: state.merge,
          logs: state.logs,
          counter: state.counter
        }
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      // Keep simulator functional if localStorage is unavailable.
    }
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return false;
      }
      const snapshot = JSON.parse(raw);
      if (!snapshot || snapshot.version !== 1 || !snapshot.state) {
        return false;
      }

      const next = snapshot.state;
      if (!next.commits || !next.branches || !next.currentBranch || !Array.isArray(next.commitOrder)) {
        return false;
      }
      if (!Object.prototype.hasOwnProperty.call(next.branches, next.currentBranch)) {
        return false;
      }

      state.commits = next.commits;
      state.commitOrder = next.commitOrder;
      state.branches = next.branches;
      state.currentBranch = next.currentBranch;
      state.workingLines = Array.isArray(next.workingLines) ? next.workingLines : commitLines(next.branches[next.currentBranch]);
      state.merge = next.merge || null;
      state.logs = Array.isArray(next.logs) ? next.logs.slice(-220) : [];
      state.counter = Number(next.counter) || 0;

      return true;
    } catch (error) {
      return false;
    }
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
    return Boolean(
      elements.simulatorSection && elements.simulatorSection.classList.contains("conflict-simulator-fallback-fullscreen")
    );
  }

  function setFallbackFullscreen(enabled) {
    if (!elements.simulatorSection) {
      return;
    }
    elements.simulatorSection.classList.toggle("conflict-simulator-fallback-fullscreen", enabled);
    document.body.classList.toggle("sim-body-lock", enabled);
    syncFullscreenButton();
  }

  function syncFullscreenButton() {
    if (!elements.sectionFullscreenBtn || !elements.simulatorSection) {
      return;
    }
    const active =
      document.fullscreenElement === elements.simulatorSection || isFallbackFullscreen();
    elements.sectionFullscreenBtn.textContent = active ? "Exit Full Screen" : "Full Screen";
    elements.sectionFullscreenBtn.setAttribute("aria-pressed", String(active));
  }
})();
