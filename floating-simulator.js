(() => {
  const existingLauncher = document.getElementById("floatingSimLauncher");
  if (existingLauncher) {
    return;
  }

  const launcher = document.createElement("button");
  launcher.id = "floatingSimLauncher";
  launcher.type = "button";
  launcher.className = "floating-sim-pill floating-sim-pill-main";
  launcher.setAttribute("aria-expanded", "false");
  launcher.setAttribute("aria-controls", "floatingSimPanel");
  launcher.textContent = "Interactive Git Console";

  const panel = document.createElement("aside");
  panel.id = "floatingSimPanel";
  panel.className = "floating-sim-panel";
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="floating-sim-header">
      <p class="floating-sim-eyebrow">Interactive Git Console</p>
      <div class="floating-sim-header-actions">
        <button id="simResetBtn" class="floating-sim-close floating-sim-reset" type="button" aria-label="Reset interactive console">Reset</button>
        <button id="simSectionFullscreenBtn" class="floating-sim-close" type="button" aria-label="Toggle full screen interactive console" aria-pressed="false">Full Screen</button>
        <button id="floatingSimClose" class="floating-sim-close" type="button" aria-label="Close interactive console">Close</button>
      </div>
    </div>
    <div class="floating-sim-body">
      <section id="simulatorSection" class="simulator floating-sim-shell">
        <div class="simulator-title-row">
          <div class="simulator-title-group">
            <h2>Interactive Git Console And Visualizer</h2>
            <p class="simulator-subcopy">Create branches, commit, switch, merge, and revert with live commit IDs.</p>
          </div>
        </div>

        <div class="simulator-grid">
          <article class="sim-console">
            <h3>Console</h3>
            <p class="sim-copy">
              Supported commands:
              <code>git branch &lt;name&gt;</code>,
              <code>git checkout -b &lt;name&gt;</code>,
              <code>git checkout &lt;branch&gt;</code>,
              <code>git commit -m "message"</code>,
              <code>git merge &lt;branch&gt;</code>,
              <code>git revert &lt;commitId&gt;</code>,
              <code>git log</code>,
              <code>git status</code>
            </p>

            <form id="gitCommandForm" class="sim-input-row">
              <input
                id="gitCommandInput"
                class="sim-command-input"
                type="text"
                placeholder='Try: git checkout -b feature/checkout'
                autocomplete="off"
              />
              <button id="gitRunButton" class="sim-run-btn" type="submit">Run</button>
            </form>

            <div class="sim-command-chips">
              <button class="sim-chip" data-command='git checkout -b feature/search'>New Branch</button>
              <button class="sim-chip" data-command='git commit -m "feat: add search filter"'>Commit</button>
              <button class="sim-chip" data-command='git checkout main'>Switch Main</button>
              <button class="sim-chip" data-command='git merge feature/search'>Merge</button>
              <button class="sim-chip" data-command="git log">Log</button>
              <button class="sim-chip" data-command="git status">Status</button>
            </div>

            <div class="sim-quick-actions">
              <div class="sim-quick-item">
                <label for="simBranchInput">Branch Name</label>
                <input id="simBranchInput" type="text" placeholder="feature/login" autocomplete="off" />
                <div class="sim-quick-buttons">
                  <button id="simCreateBranchBtn" class="sim-mini-btn" type="button">Create</button>
                  <button id="simCheckoutBranchBtn" class="sim-mini-btn" type="button">Switch</button>
                </div>
              </div>
              <div class="sim-quick-item">
                <label for="simCommitInput">Commit Message</label>
                <input id="simCommitInput" type="text" placeholder="feat: update header" autocomplete="off" />
                <button id="simCommitBtn" class="sim-mini-btn" type="button">Commit</button>
              </div>
              <div class="sim-quick-item">
                <label for="simMergeInput">Merge From Branch</label>
                <input id="simMergeInput" type="text" placeholder="feature/login" autocomplete="off" />
                <button id="simMergeBtn" class="sim-mini-btn" type="button">Merge Into Current</button>
              </div>
              <div class="sim-quick-item">
                <label for="simRevertInput">Revert Commit ID</label>
                <input id="simRevertInput" type="text" placeholder="commit id" autocomplete="off" />
                <button id="simRevertBtn" class="sim-mini-btn" type="button">Revert</button>
              </div>
            </div>

            <div id="gitOutput" class="git-output" aria-live="polite"></div>
          </article>

          <article class="sim-graph">
            <div class="sim-graph-head">
              <h3>Live Commit Graph</h3>
              <label class="sim-zoom-control" for="graphZoomRange">
                Zoom
                <input id="graphZoomRange" type="range" min="60" max="220" step="10" value="100" />
                <span id="graphZoomValue">100%</span>
              </label>
            </div>
            <div class="sim-graph-wrap">
              <svg id="gitSimGraph" role="img" aria-label="Interactive git commit graph"></svg>
            </div>
          </article>
        </div>

        <div class="sim-state">
          <article class="sim-state-card">
            <h3>Branch Pointers</h3>
            <ul id="branchStateList" class="sim-branch-list"></ul>
          </article>
          <article class="sim-state-card">
            <h3>HEAD</h3>
            <p id="headStateText" class="sim-head-text"></p>
          </article>
        </div>
      </section>
    </div>
  `;

  document.body.appendChild(panel);
  document.body.appendChild(launcher);

  const closeButton = document.getElementById("floatingSimClose");
  const commandInput = document.getElementById("gitCommandInput");
  const output = document.getElementById("gitOutput");

  function isOpen() {
    return panel.classList.contains("is-open");
  }

  function setOpen(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("floating-sim-open", open);

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
    if (event.key === "Escape" && isOpen() && !document.fullscreenElement) {
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
