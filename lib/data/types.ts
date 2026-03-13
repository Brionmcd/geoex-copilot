// === CORE OBJECTS (Mirror Sugati/Salesforce) ===

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyTier:
    | "champion"
    | "power_couple"
    | "family"
    | "solo_adventurer"
    | "bucket_lister"
    | "at_risk";
  totalLTV: number;
  totalTrips: number;
  lastTripDate: string | null;
  daysSinceLastTrip: number | null;
  emailOpenRate: number;
  churnRiskScore: number;
  referralCount: number;
  dietaryRequirements: string | null;
  roomPreference: string | null;
  travelStyle: string[];
  notes: string;
  passportNumber: string | null;
  passportExpiry: string | null;
  passportNationality: string | null;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  region: string;
  departureDate: string;
  returnDate: string;
  daysUntilDeparture: number;
  status: "confirmed" | "pending" | "cancelled";
  sugatiPhase:
    | "enquiry"
    | "quoting"
    | "booking"
    | "pre_holiday"
    | "during_holiday"
    | "post_holiday";
  groupSize: number;
  maxCapacity: number;
  assignedGSM: StaffMember;
  assignedRM: StaffMember;
  activities: string[];
  supplier: Supplier;
  tripReadinessScore: number;
}

export interface GroupMember {
  id: string;
  contactId: string;
  tripId: string;
  contact: Contact;

  // Document status (per-trip)
  passportSubmitted: boolean;
  passportVerified: boolean;
  passportExpiryValid: boolean;
  medicalFormSubmitted: boolean;
  medicalFormApproved: boolean;
  waiversSigned: string[];
  waiversRequired: string[];
  flightDetailsSubmitted: boolean;

  // Payment status (per-trip)
  depositPaid: boolean;
  depositDate: string | null;
  finalPaymentDue: string;
  finalPaymentPaid: boolean;
  finalPaymentDate: string | null;
  paymentMethod: "credit_card" | "ach" | "wire" | null;

  // Insurance (per-trip)
  tciPurchased: boolean;
  tciPurchaseDate: string | null;
  tciDeadline: string;
  tciCFAReligible: boolean;
  ripcordEnrolled: boolean;

  // Readiness
  documentCompletionPercent: number;
  readinessScore: number;
  lastFollowUpDate: string | null;
  followUpCount: number;
  welcomeEmailSent: boolean;
  welcomeEmailDate: string | null;
  coordinatorCallCompleted: boolean;
  coordinatorCallDate: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  destination: string;
  tier: "platinum" | "gold" | "silver" | "probation";
  sentimentScore: number;
  avgResponseTime: number;
  slaTarget: number;
  rating: number;
  incidentCount: number;
  lastIncidentDate: string | null;
  primaryContact: string;
  email: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: "gsm" | "rm" | "comms" | "manager" | "marketing";
  email: string;
  activeTrips: number;
  activeTravelers: number;
}

export interface Notification {
  id: string;
  type:
    | "document_alert"
    | "payment_deadline"
    | "system_warning"
    | "agent_activity"
    | "supplier_alert";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  suggestedAction: string | null;
  relatedTripId: string | null;
  relatedContactId: string | null;
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: "completed" | "flagged" | "error";
  details: string;
  humanReviewRequired: boolean;
}

// === APP-LEVEL TYPES ===

export type UserRole = "gsm" | "rm" | "comms" | "manager" | "marketing";

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  pinned: boolean;
}

export interface ComponentBlock {
  component: string;
  [key: string]: unknown;
}

// === WORKFLOW LIBRARY TYPES ===

export type SystemId =
  | "sugati"
  | "pax_cal"
  | "compass"
  | "asana"
  | "axus"
  | "ripcord"
  | "g3_visas"
  | "feefo"
  | "smartsheet"
  | "email"
  | "j_drive"
  | "domo"
  | "mailchimp"
  | "google_ads"
  | "anthropic";

export type OutputType =
  | "table"
  | "checklist"
  | "chart"
  | "status_card"
  | "email_draft"
  | "dashboard"
  | "alert"
  | "customer_profile"
  | "narrative";

export type WorkflowStatus = "automated" | "planned" | "in_review";
export type WorkflowPriority = "critical" | "high" | "medium" | "low";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  systemId?: SystemId;
  toolName?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  systems: SystemId[];
  outputTypes: OutputType[];
  steps: WorkflowStep[];
  status: WorkflowStatus;
  priority: WorkflowPriority;
  owner?: string;
  notes?: string;
  lastReviewedDate?: string;
  prompt: string;
  chipLabel: string;
  isFeatured?: boolean;
}

export interface WorkflowCategory {
  id: string;
  label: string;
  iconName: string;
  color: string;
  description?: string;
}
