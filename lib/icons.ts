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
  Cpu,
  Globe,
  BookOpen,
  ListTodo,
  Map,
  Shield,
  Stamp,
  Star,
  FolderOpen,
  BarChart2,
  Send,
  Megaphone,
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
  pax_cal: Sheet,
  compass: BookOpen,
  asana: ListTodo,
  axus: Map,
  ripcord: Shield,
  g3_visas: Stamp,
  feefo: Star,
  smartsheet: Sheet,
  email: Mail,
  j_drive: FolderOpen,
  domo: BarChart2,
  mailchimp: Send,
  google_ads: Megaphone,
  anthropic: Cpu,
};

const systemLabelMap: Record<string, string> = {
  sugati: "Sugati CRM",
  pax_cal: "Pax Cal",
  compass: "Compass",
  asana: "Asana",
  axus: "Axus",
  ripcord: "Ripcord",
  g3_visas: "G3 Visas",
  feefo: "Feefo",
  smartsheet: "Smartsheet",
  email: "Email",
  j_drive: "J Drive",
  domo: "Domo",
  mailchimp: "Mailchimp",
  google_ads: "Google Ads",
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
