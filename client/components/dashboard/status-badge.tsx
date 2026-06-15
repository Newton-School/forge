import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/lib/labels";
import {
  CONCERN_LABEL, FLAG_LABEL, L2_LABEL, L3_LABEL, L4_LABEL, SEVERITY_LABEL, WORK_LABEL,
} from "@/lib/labels";
import type {
  AutoFlag, ConcernStatus, MenteeStatusL2, MentorStatusL3, Severity, TeacherDecisionL4, WorkStatus,
} from "@/lib/types";

export function StatusBadge({ text, tone, dot }: { text: string; tone: BadgeTone; dot?: string }) {
  return (
    <Badge tone={tone}>
      {dot ? <span className="text-[10px] leading-none">{dot}</span> : null}
      {text}
    </Badge>
  );
}

export const L2Badge = ({ v }: { v: MenteeStatusL2 }) => <StatusBadge {...L2_LABEL[v]} />;
export const L3Badge = ({ v }: { v: MentorStatusL3 }) => <StatusBadge {...L3_LABEL[v]} />;
export const L4Badge = ({ v }: { v: TeacherDecisionL4 | null }) =>
  v ? <StatusBadge {...L4_LABEL[v]} /> : <span className="text-xs text-subtle-foreground">Pending</span>;
export const FlagBadge = ({ v }: { v: AutoFlag }) =>
  v === "NONE" ? <span className="text-xs text-subtle-foreground">—</span> : <StatusBadge {...FLAG_LABEL[v]} />;
export const WorkBadge = ({ v }: { v: WorkStatus }) => <StatusBadge {...WORK_LABEL[v]} />;
export const ConcernBadge = ({ v }: { v: ConcernStatus }) => <StatusBadge {...CONCERN_LABEL[v]} />;
export const SeverityBadge = ({ v }: { v: Severity }) => <StatusBadge {...SEVERITY_LABEL[v]} />;
