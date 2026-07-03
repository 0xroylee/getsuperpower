export interface WorkflowSkill {
  name: string;
  description: string;
}

export interface WorkflowCardContent {
  name: string;
  description: string;
  entrySkill: string;
  tag: string;
  accent: string;
  skills: WorkflowSkill[];
}

export interface CommandExample {
  label: string;
  command: string;
}

export const githubUrl = "https://github.com/0xroylee/getsuperpower";

export const agents = ["Claude", "Codex", "opencode", "Cursor", "GitHub Copilot"];

export const workflows: WorkflowCardContent[] = [
  {
    name: "OpenSpec Delivery",
    description:
      "A complete delivery lifecycle from proposal through design, TDD build, verification, and archive.",
    entrySkill: "openspec-delivery",
    tag: "Featured",
    accent: "text-violet-300",
    skills: [
      { name: "opsx-propose", description: "Draft the scoped spec change" },
      {
        name: "brainstorming",
        description: "Explore viable design approaches",
      },
      {
        name: "writing-plans",
        description: "Create an executable implementation plan",
      },
      { name: "tdd-build", description: "Build task by task with tests first" },
      {
        name: "pony-trail",
        description: "Record verification and rollback context",
      },
    ],
  },
  {
    name: "Release Review",
    description:
      "A lightweight workflow for shaping release risk, reviewing diffs, and preserving evidence.",
    entrySkill: "release-review",
    tag: "Starter",
    accent: "text-sky-300",
    skills: [
      { name: "shape", description: "Clarify the release request" },
      { name: "release-risk-review", description: "Flag risk by surface area" },
      {
        name: "writing-plans",
        description: "Plan the release follow-through",
      },
      {
        name: "pony-trail",
        description: "Capture evidence and rollback notes",
      },
    ],
  },
  {
    name: "Real Engineering",
    description:
      "Combines RTK, pony-trail, Superpowers, and Matt Pocock skills for TypeScript-heavy engineering.",
    entrySkill: "real-engineering",
    tag: "Advanced",
    accent: "text-amber-300",
    skills: [
      { name: "rtk", description: "Token-efficient command execution" },
      {
        name: "mattpocock:tdd",
        description: "Focused red-green-refactor loops",
      },
      {
        name: "superpowers:verify",
        description: "Completion checks before delivery",
      },
      {
        name: "pony-trail",
        description: "Decision snapshots around file changes",
      },
    ],
  },
  {
    name: "Development Design Delivery",
    description:
      "Product-minded engineering from shape to interface design, plan, TDD, review, and evidence.",
    entrySkill: "development-design-delivery",
    tag: "Product",
    accent: "text-emerald-300",
    skills: [
      { name: "brainstorming", description: "Shape the feature and constraints" },
      {
        name: "design-an-interface",
        description: "Explore interface directions",
      },
      { name: "writing-plans", description: "Split the work into small tasks" },
      { name: "tdd", description: "Build through public seams" },
      { name: "review", description: "Check behavior and risks" },
    ],
  },
];

export const commands: CommandExample[] = [
  {
    label: "Install OpenSpec Delivery",
    command:
      "npx getsuperpower@latest install 'https://github.com/0xroylee/getsuperpower.git#examples/workflows/openspec-superpowers'",
  },
  {
    label: "Install Release Review",
    command:
      "npx getsuperpower@latest install 'https://github.com/0xroylee/getsuperpower.git#examples/workflows/release-review'",
  },
  {
    label: "List installed GetSuperpowers",
    command: "npx getsuperpower@latest list",
  },
  {
    label: "Create your own workflow",
    command: "npx getsuperpower@latest init my-workflow",
  },
  {
    label: "Validate before sharing",
    command: "npx getsuperpower@latest validate my-workflow",
  },
];

export const howItWorks = [
  {
    title: "workflow.json installs the skill tree",
    body: "A single manifest defines the callable entry skill and every local or external sub-skill it needs.",
  },
  {
    title: "The entry skill is the one command users call",
    body: "Users invoke a single skill, such as $openspec-delivery, and the workflow coordinates the rest.",
  },
  {
    title: "Sub-skills run in a deliberate order",
    body: "Proposal, design, planning, TDD, verification, and archive steps stay aligned without manual juggling.",
  },
];
