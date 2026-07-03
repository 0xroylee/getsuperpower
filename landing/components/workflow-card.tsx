import { ArrowRight, Zap } from "lucide-react";
import type { WorkflowCardContent } from "../lib/landing-content";

export function WorkflowCard({
  name,
  description,
  entrySkill,
  skills,
  tag,
  accent,
}: WorkflowCardContent) {
  return (
    <article className="group relative rounded-lg border border-white/10 bg-white/[0.035] p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
      <span
        className={`inline-flex rounded-full border border-current/20 px-2 py-0.5 text-xs ${accent}`}
      >
        {tag}
      </span>
      <h3 className="mt-4 text-lg font-medium text-white/90">{name}</h3>
      <p className="mt-2 min-h-16 text-sm leading-6 text-white/50">{description}</p>

      <div className="mt-5 rounded-lg border border-white/10 bg-black/35 p-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/35">
          <Zap size={12} className="text-amber-300" />
          entry skill
        </div>
        <code className={`mt-2 block break-all font-mono text-sm ${accent}`}>${entrySkill}</code>
      </div>

      <div className="mt-5 space-y-3">
        {skills.map((skill) => (
          <div key={skill.name} className="flex gap-3">
            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />
            <div>
              <code className="font-mono text-xs text-white/65">{skill.name}</code>
              <p className="mt-0.5 text-xs leading-5 text-white/38">{skill.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-white/35 transition group-hover:text-white/55">
        View workflow
        <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
      </div>
    </article>
  );
}
