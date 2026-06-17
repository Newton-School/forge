import {
  Activity, Bell, Boxes, Calendar, ChartBar, CircleCheckBig, CircleDot, ClipboardCheck,
  ClipboardList, Flag, FolderGit2, GitBranch, GitCompare, GitPullRequest,
  GraduationCap, LayoutDashboard, Mail, MessageSquare, Network, OctagonAlert, Package,
  Plug, ScrollText, Settings, ShieldAlert, ShieldCheck, User, UserCheck, UserPlus,
  Users, type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Activity, Bell, Boxes, Calendar, ChartBar, CircleCheckBig, CircleDot, ClipboardCheck,
  ClipboardList, Flag, FolderGit2, GitBranch, GitCompare, GitPullRequest,
  GraduationCap, LayoutDashboard, Mail, MessageSquare, Network, OctagonAlert, Package,
  Plug, ScrollText, Settings, ShieldAlert, ShieldCheck, User, UserCheck, UserPlus, Users,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
