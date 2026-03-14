const CONSENSUS_STORAGE_KEY = "gitVisualizerConsensusDraftV1";

function formatToday() {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date());
}

function getCheckedValues(form, name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function applyCheckedValues(form, name, values) {
  const selected = new Set(Array.isArray(values) ? values : []);
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function fallbackCopy(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "true");
  helper.style.position = "absolute";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

(() => {
  const form = document.getElementById("consensusForm");
  if (!form) return;

  const output = document.getElementById("consensusOutput");
  const copyBtn = document.getElementById("copyConsensusBtn");
  const resetBtn = document.getElementById("resetConsensusBtn");
  const status = document.getElementById("consensusStatus");
  const dateInput = document.getElementById("consensusDate");

  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#a13e3e" : "#375c7c";
  };

  if (dateInput && !dateInput.value) {
    dateInput.value = formatToday();
  }

  const readDraft = () => {
    const payload = {
      client: form.client.value.trim(),
      date: form.date.value.trim(),
      strategy: form.strategy.value,
      provider: form.provider.value,
      promotionModel: form.promotionModel.value,
      rollbackModel: form.rollbackModel.value,
      protection: getCheckedValues(form, "protection"),
      gate: getCheckedValues(form, "gate"),
      risks: form.risks.value.trim()
    };
    return payload;
  };

  const writeDraftToForm = (draft) => {
    if (!draft || typeof draft !== "object") return;
    if (typeof draft.client === "string") form.client.value = draft.client;
    if (typeof draft.date === "string") form.date.value = draft.date || formatToday();
    if (typeof draft.strategy === "string") form.strategy.value = draft.strategy;
    if (typeof draft.provider === "string") form.provider.value = draft.provider;
    if (typeof draft.promotionModel === "string") form.promotionModel.value = draft.promotionModel;
    if (typeof draft.rollbackModel === "string") form.rollbackModel.value = draft.rollbackModel;
    if (typeof draft.risks === "string") form.risks.value = draft.risks;
    applyCheckedValues(form, "protection", draft.protection);
    applyCheckedValues(form, "gate", draft.gate);
  };

  const buildSummary = (draft) => {
    const protections = draft.protection.length > 0 ? draft.protection.join("; ") : "None selected";
    const gates = draft.gate.length > 0 ? draft.gate.join("; ") : "None selected";
    const risks = draft.risks || "None documented.";
    const clientLabel = draft.client || "Unspecified client/program";
    const dateLabel = draft.date || formatToday();
    return [
      "Branching Strategy Consensus Snapshot",
      `Client / Program: ${clientLabel}`,
      `Decision Date: ${dateLabel}`,
      `Primary Strategy: ${draft.strategy}`,
      `Git Provider: ${draft.provider}`,
      `Promotion Model: ${draft.promotionModel}`,
      `Rollback Default: ${draft.rollbackModel}`,
      "",
      `Branch Protection: ${protections}`,
      `FlexDeploy Gates: ${gates}`,
      `Open Risks / Exceptions: ${risks}`,
      "",
      "Next action: implement policy in Git host and FlexDeploy, then pilot on one repository."
    ].join("\n");
  };

  const persistDraft = (draft) => {
    try {
      window.localStorage.setItem(CONSENSUS_STORAGE_KEY, JSON.stringify(draft));
    } catch (_error) {
      setStatus("Draft could not be persisted in this browser session.", true);
    }
  };

  const refresh = () => {
    const draft = readDraft();
    output.textContent = buildSummary(draft);
    persistDraft(draft);
    if (!status.textContent) {
      setStatus("Summary updates automatically as you edit.");
    }
  };

  try {
    const savedDraftRaw = window.localStorage.getItem(CONSENSUS_STORAGE_KEY);
    if (savedDraftRaw) {
      writeDraftToForm(JSON.parse(savedDraftRaw));
      setStatus("Loaded previous workshop draft.");
    }
  } catch (_error) {
    setStatus("Saved draft is unavailable. Working with defaults.", true);
  }

  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);

  copyBtn?.addEventListener("click", async () => {
    const text = output.textContent || "";
    if (!text.trim()) {
      setStatus("Nothing to copy yet.", true);
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        fallbackCopy(text);
      }
      setStatus("Decision snapshot copied to clipboard.");
    } catch (_error) {
      setStatus("Clipboard copy failed. Select and copy manually.", true);
    }
  });

  resetBtn?.addEventListener("click", () => {
    form.reset();
    if (dateInput) {
      dateInput.value = formatToday();
    }
    try {
      window.localStorage.removeItem(CONSENSUS_STORAGE_KEY);
    } catch (_error) {
      // Ignore storage cleanup failures.
    }
    setStatus("Form reset to defaults.");
    refresh();
  });

  refresh();
})();
