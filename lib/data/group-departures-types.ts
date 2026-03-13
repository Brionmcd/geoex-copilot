// ──────────────────────────────────────────────────────
// Group Departures – Data Types
// Departure-centric model (NOT booking-centric)
// ──────────────────────────────────────────────────────

export type DepartureStatus =
  | "Active"
  | "Sold Out"
  | "Cancelled"
  | "Departed"
  | "Completed";

export type GuestStatus =
  | "Confirmed"
  | "Pending Payment"
  | "Cancelled"
  | "Transferred In"
  | "Transferred Out"
  | "Waitlisted";

export type InsuranceType =
  | "Ripcord Basic"
  | "Ripcord Premium"
  | "Third Party"
  | "Declined"
  | null;

export type VisaStatus = "N/A" | "Required" | "In Progress" | "Approved" | "Issue";
export type PaymentMethod = "ACH" | "Credit Card" | "Wire" | "Check";

export type AvailabilityLanguage =
  | "Open"
  | "Limited Availability"
  | "Only X Spots Remaining"
  | "Last X Spots!"
  | "Sold Out"
  | "Waitlist Open";

export type AuditSeverity = "critical" | "warning" | "info";
export type CrisisGuestResponse = "Go" | "No Go" | "No Response";
export type SecurityStatus = "Normal" | "Advisory" | "Warning" | "Do Not Travel";

// ── Pricing ──

export interface PricingTier {
  minPax: number;
  maxPax: number;
  landPrice: number;
}

// ── Guest Payment ──

export interface GuestPayments {
  depositAmount: number;
  depositPaid: boolean;
  depositPaidDate: string | null;
  interimAmount: number;
  interimDueDate: string;
  interimPaid: boolean;
  interimPaidDate: string | null;
  finalBalanceAmount: number;
  finalBalanceDueDate: string;
  finalBalancePaid: boolean;
  finalBalancePaidDate: string | null;
  totalPaid: number;
  totalDue: number;
  paymentMethod: PaymentMethod;
}

// ── Guest Insurance ──

export interface GuestInsurance {
  purchased: boolean;
  type: InsuranceType;
  purchaseDate: string | null;
  cfarEligible: boolean;
}

// ── Guest Documents ──

export interface GuestDocuments {
  passportOnFile: boolean;
  passportExpiry: string | null;
  medicalFormComplete: boolean;
  waiverSigned: boolean;
  visaRequired: boolean;
  visaStatus: VisaStatus;
}

// ── Guest Transfer ──

export interface GuestTransfer {
  tripName: string;
  departureId: string;
  transferDate: string;
}

// ── Guest (per-departure) ──

export interface DepartureGuest {
  id: string;
  name: string;
  email: string;
  bookingId: string;
  bookingDate: string;
  cancellationDate: string | null;
  transferredFrom: GuestTransfer | null;
  status: GuestStatus;
  landPriceInvoiced: number;
  payments: GuestPayments;
  insurance: GuestInsurance;
  documents: GuestDocuments;
  bookedOnExtension: boolean;
  bookedOnArrivalDayTour: boolean;
  isMinor: boolean;
  specialRequests: string | null;
}

// ── Departure ──

export interface GroupDeparture {
  id: string;
  tripName: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  maxCapacity: number;
  tripLeadName: string;
  roomReleaseDate: string;
  salesClosureDate: string;
  status: DepartureStatus;
  pricingTiers: PricingTier[];
  currentTierIndex: number;
  availabilityLanguage: string;
  hasPackagedExtension: boolean;
  extensionName: string | null;
  hasArrivalDayTour: boolean;
  arrivalDayTourName: string | null;
  guests: DepartureGuest[];
}

// ── Audit Issue ──

export interface AuditIssue {
  id: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  departureId: string;
  departureName: string;
  guestId?: string;
  guestName?: string;
  action: string;
}

// ── Crisis Tracking ──

export interface CrisisDestination {
  id: string;
  destination: string;
  securityStatus: SecurityStatus;
  lastUpdated: string;
  advisoryDetail: string;
  affectedDepartures: string[]; // departure IDs
}

export interface CrisisGuestTracking {
  guestId: string;
  guestName: string;
  email: string;
  departureId: string;
  departureName: string;
  response: CrisisGuestResponse;
  responseDate: string | null;
}

// ── Derived / Computed Helpers ──

export interface DepartureSummary {
  id: string;
  tripName: string;
  destination: string;
  departureDate: string;
  paxCount: number;
  maxCapacity: number;
  fillPercentage: number;
  currentLandPrice: number;
  availabilityLanguage: string;
  roomReleaseDate: string;
  salesClosureDate: string;
  tripLeadName: string;
  status: DepartureStatus;
  revenueBooked: number;
  paymentsCollected: number;
  paymentsOutstanding: number;
}

export interface PaymentDueItem {
  guestId: string;
  guestName: string;
  departureId: string;
  departureName: string;
  departureDate: string;
  paymentType: "Deposit" | "Interim" | "Final Balance";
  amountDue: number;
  dueDate: string;
  daysOverdue: number;
}

export interface PricingAlert {
  departureId: string;
  departureName: string;
  currentPax: number;
  previousTierIndex: number;
  newTierIndex: number;
  previousPrice: number;
  newPrice: number;
  checklist: PricingAlertAction[];
}

export interface PricingAlertAction {
  id: string;
  label: string;
  system: string;
  completed: boolean;
}

// ── Group Operations Sub-tab ──

export type GroupOpsTab =
  | "departures"
  | "yield"
  | "pricing"
  | "audit"
  | "crisis";
