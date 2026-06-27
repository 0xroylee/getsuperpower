import type {
  RequirementCourtResult,
  RequirementCourtRound,
  RequirementDiscussionEntry,
} from "./requirement-court";
import { formatRequirementPonyRun, getDetailedRequirementChanges } from "./requirement-report";

export function renderRequirementCourtHtml(result: RequirementCourtResult): string {
  const title = result.detailedRequirement.title;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Approve: ${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --page-bg: #f7f3ed;
      --panel: #fffdf9;
      --panel-soft: #fbf7f0;
      --ink: #211c18;
      --muted: #766b61;
      --line: rgba(69, 56, 44, 0.14);
      --accent: #b86b43;
      --accent-soft: #f7e5d8;
      --approve: #24745a;
      --approve-soft: #e6f1ec;
      --amend: #9a6a24;
      --amend-soft: #f5ead5;
      --reject: #ad3d32;
      --shadow: 0 24px 80px rgba(49, 39, 29, 0.12);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(184, 107, 67, 0.16), transparent 28rem),
        linear-gradient(180deg, #fbf8f3 0%, var(--page-bg) 52%, #f3eee6 100%);
      color: var(--ink);
      font: 16px/1.55 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
    }
    main {
      width: min(1080px, calc(100% - 32px));
      margin: 0 auto;
      padding: 40px 0 56px;
    }
    .approval-hero, .review-section, .review-card, .bot-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 22px;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8) inset, var(--shadow);
    }
    .approval-hero {
      padding: 34px;
      margin-bottom: 20px;
    }
    .review-section {
      padding: 26px;
      margin-top: 18px;
    }
    .review-card, .bot-card {
      padding: 18px;
      box-shadow: 0 14px 40px rgba(49, 39, 29, 0.06);
    }
    h1, h2, h3 {
      margin: 0;
      line-height: 1.2;
    }
    h1 {
      max-width: 820px;
      font-size: 40px;
      font-weight: 760;
      letter-spacing: 0;
    }
    h2 {
      font-size: 22px;
      font-weight: 720;
      letter-spacing: 0;
    }
    h3 {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0;
    }
    p { margin: 10px 0 0; }
    ul {
      margin: 12px 0 0;
      padding-left: 22px;
    }
    li + li { margin-top: 6px; }
    .muted { color: var(--muted); }
    .eyebrow, .section-kicker {
      margin: 0 0 10px;
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }
    .hero-copy {
      max-width: 760px;
      color: var(--muted);
      font-size: 17px;
    }
    .approval-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 6px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.62);
      font-size: 14px;
      font-weight: 620;
      color: var(--muted);
      backdrop-filter: blur(12px);
    }
    .status-pending {
      border-color: rgba(184, 107, 67, 0.28);
      background: var(--accent-soft);
      color: #744023;
    }
    .status-approved {
      border-color: rgba(36, 116, 90, 0.22);
      background: var(--approve-soft);
      color: var(--approve);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .checklist, .timeline {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }
    .check {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: flex-start;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.68);
    }
    .check-status {
      color: var(--approve);
      font-size: 13px;
      font-weight: 700;
    }
    .needs-review {
      background: var(--amend-soft);
    }
    .needs-review .check-status {
      color: var(--amend);
    }
    .round {
      margin-top: 16px;
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }
    .vote-badge {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 720;
      white-space: nowrap;
    }
    .vote-approve {
      background: var(--approve-soft);
      color: var(--approve);
    }
    .vote-amend {
      background: var(--amend-soft);
      color: var(--amend);
    }
    .vote-reject {
      background: #f9e4e1;
      color: var(--reject);
    }
    .timeline {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    .timeline-step {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      background: var(--panel-soft);
      min-height: 72px;
    }
    .timeline-step strong {
      display: block;
      margin-bottom: 6px;
    }
    .list-group {
      margin-top: 14px;
    }
    .list-group h4 {
      margin: 0;
      font-size: 14px;
      color: var(--muted);
      text-transform: uppercase;
    }
    .review-card ul, .bot-card ul {
      color: #332a22;
    }
    @media (max-width: 760px) {
      main {
        width: min(100% - 20px, 1120px);
        padding-top: 20px;
      }
      h1 { font-size: 26px; }
      .grid, .timeline {
        grid-template-columns: 1fr;
      }
    }
    @media print {
      body { background: #ffffff; }
      main { width: 100%; padding: 0; }
      .approval-hero, .review-section, .review-card, .bot-card { break-inside: avoid; box-shadow: none; }
    }
  </style>
</head>
<body>
  <main>
    <header class="approval-hero">
      <p class="eyebrow">Ponytrail approval review</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="hero-copy">${escapeHtml(result.detailedRequirement.intent)}</p>
      <div class="approval-summary">
        <span class="status-pill status-pending">Human approval pending</span>
        <span class="status-pill">Human confirmation: ${escapeHtml(result.humanConfirmation)}</span>
        <span class="status-pill status-approved">Review ${
          result.verdict.approved ? "approved" : "not approved"
        }</span>
        <span class="status-pill">${result.verdict.approvals} approvals</span>
      </div>
    </header>

    <section class="review-section">
      <p class="section-kicker">Approval gate</p>
      <h2>Should I approve this?</h2>
      <p class="muted">Approve only if the scope, evidence, and remaining risks match the intended change.</p>
      ${renderApprovalChecklist(result)}
    </section>

    <section class="review-section">
      <p class="section-kicker">Scope</p>
      <h2>What exactly changes?</h2>
      <div class="grid">
        ${renderListPanel("Will change", getDetailedRequirementChanges(result.detailedRequirement))}
        ${renderListPanel("Will not change", result.detailedRequirement.exclude)}
      </div>
    </section>

    <section class="review-section">
      <p class="section-kicker">Evidence</p>
      <h2>How will we know it worked?</h2>
      <div class="grid">
        ${renderListPanel("Acceptance criteria", result.detailedRequirement.acceptanceCriteria)}
        ${renderListPanel("Evidence required", result.detailedRequirement.evidenceRequired)}
      </div>
    </section>

    <section class="review-section">
      <p class="section-kicker">Risk</p>
      <h2>Risks and open questions</h2>
      <div class="grid">
        ${renderListPanel("Risks", result.detailedRequirement.risks)}
        ${renderListPanel("Open questions", result.detailedRequirement.openQuestions)}
      </div>
    </section>

    <section class="review-section">
      <p class="section-kicker">Role review</p>
      <h2>What did the review bots say?</h2>
      ${result.rounds.map(renderRound).join("\n")}
    </section>

    <section class="review-section">
      <p class="section-kicker">Next path</p>
      <h2>What happens next?</h2>
      <div class="timeline">
        ${["brainstorm", "plan", "human approval", "implementation", "verification"]
          .map(
            (step, index) =>
              `<div class="timeline-step"><strong>${index + 1}. ${step}</strong><span class="muted">${renderTimelineCaption(
                step,
              )}</span></div>`,
          )
          .join("\n")}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function renderApprovalChecklist(result: RequirementCourtResult): string {
  const checks = [
    {
      label: "Clear intended change",
      met: getDetailedRequirementChanges(result.detailedRequirement).length > 0,
    },
    { label: "Clear exclusions", met: result.detailedRequirement.exclude.length > 0 },
    {
      label: "Acceptance criteria",
      met: result.detailedRequirement.acceptanceCriteria.length > 0,
    },
    { label: "Evidence required", met: result.detailedRequirement.evidenceRequired.length > 0 },
    { label: "Review-bot approval", met: result.verdict.approved },
    {
      label: "Known risks and open questions reviewed",
      met:
        result.detailedRequirement.risks.length > 0 ||
        result.detailedRequirement.openQuestions.length === 0,
    },
  ];

  return `<div class="checklist">${checks.map(renderCheck).join("\n")}</div>`;
}

function renderCheck(check: { label: string; met: boolean }): string {
  const className = check.met ? "check" : "check needs-review";
  const status = check.met ? "Ready" : "Needs review";

  return `<div class="${className}"><span>${escapeHtml(
    check.label,
  )}</span><span class="check-status">${status}</span></div>`;
}

function renderListPanel(title: string, values: string[]): string {
  return `<article class="review-card">
    <h3>${escapeHtml(title)}</h3>
    ${renderList(values)}
  </article>`;
}

function renderList(values: string[]): string {
  if (values.length === 0) {
    return `<p class="muted">None.</p>`;
  }

  return `<ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function renderRound(round: RequirementCourtRound): string {
  return `<section class="round">
    <h3>Round ${round.round}</h3>
    <div class="cards">
      ${round.discussion.map(renderDiscussionEntry).join("\n")}
    </div>
  </section>`;
}

function renderDiscussionEntry(entry: RequirementDiscussionEntry): string {
  return `<article class="bot-card">
    <div class="card-head">
      <div>
        <h3>${escapeHtml(entry.displayName)}</h3>
        <p class="muted">${escapeHtml(entry.botId)} - ${escapeHtml(entry.role)}</p>
      </div>
      <strong class="vote-badge vote-${entry.vote}">${escapeHtml(entry.vote)} - ${Math.round(
        entry.confidence * 100,
      )}%</strong>
    </div>
    <p><strong>Focus:</strong> ${escapeHtml(entry.visibleThinking.focus)}</p>
    <p><strong>Concern:</strong> ${escapeHtml(entry.visibleThinking.concern)}</p>
    <p><strong>Recommendation:</strong> ${escapeHtml(entry.visibleThinking.recommendation)}</p>
    <p><strong>Run:</strong> ${escapeHtml(formatRequirementPonyRun(entry.run))}</p>
    ${renderInlineList("Evidence", entry.evidence)}
    ${renderInlineList("Required changes", entry.requiredChanges)}
  </article>`;
}

function renderInlineList(title: string, values: string[]): string {
  return `<div class="list-group">
    <h4>${escapeHtml(title)}</h4>
    ${renderList(values)}
  </div>`;
}

function renderTimelineCaption(step: string): string {
  const captions: Record<string, string> = {
    brainstorm: "Clarify the request and review direction.",
    plan: "Turn the approved design into implementation tasks.",
    "human approval": "Owner confirms the plan before work starts.",
    implementation: "Workers make the approved changes.",
    verification: "Evidence proves the change is ready.",
  };

  return captions[step] ?? "";
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/gu, (character) => replacements[character] ?? character);
}
