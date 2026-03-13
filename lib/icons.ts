import {
  FileCheck,
  Users,
  Plane,
  Heart,
  DollarSign,
  Building2,
  MessageSquare,
  BarChart3,
  Database,
  Sheet,
  Mail,
  MessageCircle,
  Cpu,
  Globe,
  type LucideIcon,
} from "lucide-react";

const categoryIconMap: Record<string, LucideIcon> = {
  FileCheck,
  Users,
  Plane,
  Heart,
  DollarSign,
  Building2,
  MessageSquare,
  BarChart3,
};

const systemIconMap: Record<string, LucideIcon> = {
  sugati: Database,
  smartsheet: Sheet,
  salesforce: Globe,
  email: Mail,
  slack: MessageCircle,
  internal_db: Cpu,
  anthropic: Cpu,
};

const systemLabelMap: Record<string, string> = {
  sugati: "Sugati CRM",
  smartsheet: "Smartsheet",
  salesforce: "Salesforce",
  email: "Email",
  slack: "Slack",
  internal_db: "Internal DB",
  anthropic: "AI Engine",
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return categoryIconMap[iconName] || FileCheck;
}

export function getSystemIcon(systemId: string): LucideIcon {
  return systemIconMap[systemId] || Database;
}

export function getSystemLabel(systemId: string): string {
  return systemLabelMap[systemId] || systemId;
}
