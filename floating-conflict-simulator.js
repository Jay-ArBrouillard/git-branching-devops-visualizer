(() => {
  const existingLauncher = document.getElementById("floatingConflictLauncher");
  if (existingLauncher) {
    return;
  }

  const launcher = document.createElement("button");
  launcher.id = "floatingConflictLauncher";
  launcher.type = "button";
  launcher.className = "floating-sim-pill floating-conflict-pill";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "floatingConflictPanel");
  launcher.textContent = "Merge Conflict Simulator";

  const panel = document.createElement("aside");
  panel.id = "floatingConflictPanel";
  panel.className = "floating-sim-panel floating-conflict-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="floating-sim-header">
      <p class="floating-sim-eyebrow">Merge Conflict Simulator</p>
      <div class="floating-sim-header-actions">
        <button id="conflictResetBtn" class="floating-sim-close floating-sim-reset" type="button" aria-label="Reset merge conflict simulator">Reset</button>
        <button id="conflictSectionFullscreenBtn" class="floating-sim-close" type="button" aria-label="Toggle full screen merge conflict simulator" aria-pressed="false">Full Screen</button>
        <button id="floatingConflictClose" class="floating-sim-close" type="button" aria-label="Close merge conflict simulator">Close</button>
      </div>
    </div>
    <div class="floating-sim-body">
      <section id="conflictSimulatorSection" class="conflict-sim-shell">
        <div class="conflict-sim-layout">
          <article class="conflict-console">
            <p class="sim-copy">
              Commands:
              <code>sim seed-conflict</code>,
              <code>sim reset</code>,
              <code>git checkout &lt;branch&gt;</code>,
              <code>git edit &lt;line&gt; "text"</code>,
              <code>git merge &lt;branch&gt;</code>,
              <code>sim resolve ours|theirs|both</code>,
              <code>git add app.txt</code>,
              <code>git commit -m "message"</code>
            </p>

            <form id="conflictCommandForm" class="sim-input-row">
              <input
                id="conflictCommandInput"
                class="sim-command-input"
                type="text"
                placeholder='Try: sim seed-conflict'
                autocomplete="off"
              />
              <button class="sim-run-btn" type="submit">Run</button>
            </form>

            <div class="sim-command-chips">
              <button class="sim-chip" type="button" data-conflict-command="sim seed-conflict">Seed Conflict</button>
              <button class="sim-chip" type="button" data-conflict-command="git merge feature/cart">Trigger Conflict</button>
              <button class="sim-chip" type="button" data-conflict-command="sim resolve ours">Resolve Ours</button>
              <button class="sim-chip" type="button" data-conflict-command="sim resolve theirs">Resolve Theirs</button>
              <button class="sim-chip" type="button" data-conflict-command="git add app.txt">Stage</button>
              <button class="sim-chip" type="button" data-conflict-command='git commit -m "merge: resolve checkout conflict"'>Commit Merge</button>
              <button class="sim-chip" type="button" data-conflict-command="sim reset">Reset</button>
            </div>

            <div id="conflictOutput" class="git-output conflict-output" aria-live="polite"></div>
          </article>

          <article class="conflict-visual">
            <div class="conflict-status-row">
              <h3>Conflict View</h3>
              <span id="conflictStatusBadge" class="conflict-status-badge clean">Clean</span>
            </div>
            <p id="conflictStatusText" class="conflict-status-text"></p>

            <div class="conflict-file-grid">
              <article class="conflict-file-card">
                <h4>Base</h4>
                <pre id="conflictBaseView"></pre>
              </article>
              <article class="conflict-file-card">
                <h4>Ours</h4>
                <pre id="conflictOursView"></pre>
              </article>
              <article class="conflict-file-card">
                <h4>Theirs</h4>
                <pre id="conflictTheirsView"></pre>
              </article>
            </div>

            <article class="conflict-file-card conflict-merge-card">
              <h4>Merge Result / Markers</h4>
              <pre id="conflictMergeView"></pre>
            </article>
          </article>
        </div>

        <div class="conflict-state-grid">
          <article class="sim-state-card">
            <h3>Branch Pointers</h3>
            <ul id="conflictBranchList" class="sim-branch-list"></ul>
            <p id="conflictHeadText" class="sim-head-text"></p>
          </article>
          <article class="sim-state-card">
            <h3>Recent Commits</h3>
            <ul id="conflictCommitList" class="sim-branch-list"></ul>
          </article>
        </div>
      </section>
    </div>
  `;

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  const closeButton = document.getElementById("floatingConflictClose");
  const commandInput = document.getElementById("conflictCommandInput");
  const output = document.getElementById("conflictOutput");

  function isOpen() {
    return panel.classList.contains("is-open");
  }

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      window.setTimeout(() => {
        if (commandInput) {
          commandInput.focus();
        }
        if (output) {
          output.scrollTop = output.scrollHeight;
        }
      }, 80);
    }
  }

  launcher.addEventListener("click", () => {
    setOpen(!isOpen());
  });

  if (closeButton) {
    closeButton.addEventListener("click", () => setOpen(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
    }
  });

  document.addEventListener("mousedown", (event) => {
    if (!isOpen()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (panel.contains(target) || launcher.contains(target)) {
      return;
    }
    setOpen(false);
  });
})();
