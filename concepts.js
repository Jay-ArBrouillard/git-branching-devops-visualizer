const INTENTS = {
  setup: {
    label: "Project Setup",
    summary: "Use these commands when you start working with a repository for the first time.",
    commands: [
      {
        command: "git clone <repo-url>",
        meaning: "Copies a remote repository to your local machine.",
        whenToUse: "First time joining a project.",
        watchOut: "Use HTTPS or SSH URL consistently with your credentials."
      },
      {
        command: "git remote -v",
        meaning: "Shows which remote repositories your local repo points to.",
        whenToUse: "Confirm where push and pull operations go.",
        watchOut: "Incorrect remotes can push code to the wrong repository."
      },
      {
        command: "git checkout -b feature/my-change",
        meaning: "Creates and switches to a new branch in one step.",
        whenToUse: "Start a new feature or fix.",
        watchOut: "Create from the correct base branch (usually main or develop)."
      }
    ]
  },
  track: {
    label: "Track Changes",
    summary: "These commands move your edits from files into clean, reviewable commits.",
    commands: [
      {
        command: "git status",
        meaning: "Shows modified, staged, and untracked files.",
        whenToUse: "Before and after every commit.",
        watchOut: "Do not commit generated files unless your project expects them."
      },
      {
        command: "git add <file> or git add .",
        meaning: "Stages selected changes for the next commit.",
        whenToUse: "When you are ready to capture work in a commit.",
        watchOut: "Avoid staging unrelated changes in a single commit."
      },
      {
        command: "git commit -m \"feat: add search filter\"",
        meaning: "Creates a new commit from staged changes.",
        whenToUse: "After each logical unit of work.",
        watchOut: "Message should explain intent, not only file names."
      }
    ]
  },
  collaborate: {
    label: "Collaborate",
    summary: "Use these commands to sync with teammates and publish your branch for review.",
    commands: [
      {
        command: "git pull",
        meaning: "Fetches and integrates latest changes from tracked remote branch.",
        whenToUse: "Before starting work and before opening a pull request.",
        watchOut: "Pulling late can increase merge conflicts."
      },
      {
        command: "git push -u origin feature/my-change",
        meaning: "Publishes your branch to remote and sets upstream tracking.",
        whenToUse: "When your branch is ready for sharing and CI checks.",
        watchOut: "Confirm branch name before pushing."
      },
      {
        command: "git fetch --all",
        meaning: "Downloads remote updates without changing your local files.",
        whenToUse: "Inspect updates safely before merging.",
        watchOut: "Fetch alone does not update your current branch."
      }
    ]
  },
  integrate: {
    label: "Integrate Work",
    summary: "These commands combine branch work and keep history current.",
    commands: [
      {
        command: "git merge feature/my-change",
        meaning: "Combines the target branch history into current branch.",
        whenToUse: "After PR approval or local integration tasks.",
        watchOut: "Resolve conflicts carefully and rerun tests."
      },
      {
        command: "git rebase main",
        meaning: "Replays your branch commits on top of latest main.",
        whenToUse: "Keep branch up to date with cleaner history.",
        watchOut: "Avoid rebasing commits that are already shared publicly."
      },
      {
        command: "git log --oneline --graph --decorate",
        meaning: "Visual summary of commit history and branch pointers.",
        whenToUse: "Understand commit flow before merge or rollback.",
        watchOut: "Use this to verify where HEAD is before risky operations."
      }
    ]
  },
  recover: {
    label: "Recover Safely",
    summary: "Use these commands when undoing mistakes or rolling back bad changes.",
    commands: [
      {
        command: "git restore <file>",
        meaning: "Discards unstaged edits in a specific file.",
        whenToUse: "You changed a file and want to throw away local edits.",
        watchOut: "This is local and irreversible for unstaged content."
      },
      {
        command: "git revert <commit-sha>",
        meaning: "Creates a new commit that reverses an earlier commit.",
        whenToUse: "Undo a bad change in shared history safely.",
        watchOut: "Preferred over reset for branches used by teams."
      },
      {
        command: "git stash && git stash pop",
        meaning: "Temporarily saves uncommitted changes, then restores them later.",
        whenToUse: "Pause work to switch branches quickly.",
        watchOut: "Name your stash if juggling multiple interrupted tasks."
      }
    ]
  }
};

const GLOSSARY = [
  {
    term: "HEAD",
    plain: "Pointer to your current commit and checked-out branch.",
    why: "Helps you understand where new commits will be added."
  },
  {
    term: "Origin",
    plain: "Default name for your main remote repository.",
    why: "Most push and pull commands use origin as the default target."
  },
  {
    term: "Conflict",
    plain: "Git cannot auto-merge because two changes overlap.",
    why: "Conflict resolution is a core team skill during integration."
  },
  {
    term: "Fast-forward merge",
    plain: "Branch pointer moves ahead with no merge commit.",
    why: "Keeps history linear when no branch divergence exists."
  },
  {
    term: "Cherry-pick",
    plain: "Apply one specific commit onto another branch.",
    why: "Useful for urgent hotfix back-porting between branches."
  },
  {
    term: "Detached HEAD",
    plain: "You checked out a commit directly, not a branch.",
    why: "Changes can be lost unless you create a branch."
  }
];

const elements = {
  intentTabs: document.getElementById("intentTabs"),
  intentSummary: document.getElementById("intentSummary"),
  commandCards: document.getElementById("commandCards"),
  glossaryBody: document.getElementById("glossaryBody")
};

const state = {
  intentId: "setup"
};

function renderIntentTabs() {
  elements.intentTabs.textContent = "";

  Object.entries(INTENTS).forEach(([intentId, intent]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-btn";
    button.textContent = intent.label;
    button.setAttribute("aria-pressed", String(state.intentId === intentId));
    button.addEventListener("click", () => {
      state.intentId = intentId;
      renderIntentTabs();
      renderIntent();
    });
    elements.intentTabs.appendChild(button);
  });
}

function renderIntent() {
  const intent = INTENTS[state.intentId];
  elements.intentSummary.textContent = intent.summary;
  elements.commandCards.textContent = "";

  intent.commands.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "command-card";

    const command = document.createElement("code");
    command.className = "command-card-code";
    command.textContent = entry.command;

    const meaning = document.createElement("p");
    meaning.innerHTML = `<strong>What it does:</strong> ${entry.meaning}`;

    const whenToUse = document.createElement("p");
    whenToUse.innerHTML = `<strong>When to use:</strong> ${entry.whenToUse}`;

    const watchOut = document.createElement("p");
    watchOut.innerHTML = `<strong>Watch out:</strong> ${entry.watchOut}`;

    card.appendChild(command);
    card.appendChild(meaning);
    card.appendChild(whenToUse);
    card.appendChild(watchOut);

    elements.commandCards.appendChild(card);
  });
}

function renderGlossary() {
  elements.glossaryBody.textContent = "";

  GLOSSARY.forEach((row) => {
    const tr = document.createElement("tr");
    tr.appendChild(createCell("th", row.term));
    tr.appendChild(createCell("td", row.plain));
    tr.appendChild(createCell("td", row.why));
    elements.glossaryBody.appendChild(tr);
  });
}

function createCell(tag, text) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
}

renderIntentTabs();
renderIntent();
renderGlossary();
