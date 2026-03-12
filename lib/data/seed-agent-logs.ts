import type { AgentLog } from "@/lib/data/types";

export const agentLogs: AgentLog[] = [
  // === Document Collection Tracker ===
  {
    id: "log-001",
    agentName: "Document Collection Tracker",
    action: "Daily document status scan across all active trips",
    timestamp: "2026-03-12T06:30:00Z",
    status: "completed",
    details:
      "Scanned 52 group members across 5 trips. 38 members (73%) have complete documentation. 14 members have outstanding items. Generated 3 critical alerts and 2 warning alerts. Costa Rica at 92%, Japan at 80%, Patagonia at 65%, Tanzania at 40%, Galapagos at 20%.",
    humanReviewRequired: false,
  },
  {
    id: "log-002",
    agentName: "Document Collection Tracker",
    action: "Flagged critical missing medical form for minor",
    timestamp: "2026-03-11T09:10:00Z",
    status: "flagged",
    details:
      "Tyler Thompson (con-012), age 12, is missing medical form for Costa Rica Family Adventure (trip-005) departing in 15 days. Contact has known peanut allergy requiring EpiPen access. This is a safety-critical document for a minor with a serious allergy. Parent Susan Thompson has been contacted 3 times.",
    humanReviewRequired: true,
  },
  {
    id: "log-003",
    agentName: "Document Collection Tracker",
    action: "Passport expiry validation check",
    timestamp: "2026-03-10T11:00:00Z",
    status: "flagged",
    details:
      "Identified 2 Tanzania Safari travelers with passport expiry issues. Lawrence Grant (con-023) passport expires 2026-09-15 (97 days after departure). Beverly Hayes (con-024) passport expires 2026-08-20 (71 days after departure). Both fall within the 6-month validity requirement for East African entry. Renewal processing time: 6-8 weeks standard.",
    humanReviewRequired: true,
  },

  // === System Reconciliation ===
  {
    id: "log-004",
    agentName: "System Reconciliation",
    action: "Daily Sugati-Smartsheet data sync",
    timestamp: "2026-03-12T05:00:00Z",
    status: "completed",
    details:
      "Reconciled data between Sugati CRM and Smartsheet tracking sheets for all 5 active trips. 1 minor discrepancy resolved: Philip Nakamura (con-030) flight details timestamp showed 2-second delta between systems, auto-corrected to latest value. All payment records match. All contact details synchronized.",
    humanReviewRequired: false,
  },
  {
    id: "log-005",
    agentName: "System Reconciliation",
    action: "Detected field mismatch in contact record",
    timestamp: "2026-03-09T05:15:00Z",
    status: "flagged",
    details:
      "Margaret Chen (con-003) email address differs between Sugati (m.chen@email.com) and Salesforce (margaret.chen@email.com). Unable to auto-resolve as both appear to be valid addresses. Requires manual verification to determine primary contact email.",
    humanReviewRequired: true,
  },

  // === Payment Monitor ===
  {
    id: "log-006",
    agentName: "Payment Monitor",
    action: "Processed 3 incoming payments",
    timestamp: "2026-03-11T15:15:00Z",
    status: "completed",
    details:
      "Verified and recorded final payments: Nathan Cross (gm-030, Japan, $8,450 credit card), Irene Kowalski (gm-031, Japan, $12,200 wire), Lisa Bergman (gm-026, Japan, $7,800 ACH). All amounts match invoiced totals. Payment confirmations sent.",
    humanReviewRequired: false,
  },
  {
    id: "log-007",
    agentName: "Payment Monitor",
    action: "Flagged overdue deposits for Tanzania travelers",
    timestamp: "2026-03-10T16:00:00Z",
    status: "flagged",
    details:
      "Patricia Moore (con-007) and Greg Moore (con-008) have not submitted deposits for Tanzania Safari (trip-002). Patricia contacted 2 times, Greg contacted 4 times. Final payment deadline April 10, 2026. Recommend escalation to personal phone call.",
    humanReviewRequired: true,
  },
  {
    id: "log-008",
    agentName: "Payment Monitor",
    action: "Japan trip final payment deadline reminder batch",
    timestamp: "2026-03-12T06:00:00Z",
    status: "completed",
    details:
      "Sent final payment deadline reminders to 4 Japan Cultural Journey travelers: Brandon Reese, Priya Sharma, Margaret Chen, Howard Chen. Deadline is today (March 12, 2026). Automated emails dispatched with payment links.",
    humanReviewRequired: false,
  },

  // === Insurance Compliance ===
  {
    id: "log-009",
    agentName: "Insurance Compliance",
    action: "TCI eligibility and compliance check",
    timestamp: "2026-03-11T06:45:00Z",
    status: "completed",
    details:
      "TCI compliance scan results: 34 of 52 travelers have purchased TCI. CFAR eligibility: 28 travelers eligible (purchased within deadline), 6 travelers past CFAR deadline (all Galapagos). Remaining 18 travelers: 8 still within purchase window, 10 past deadline but standard TCI available.",
    humanReviewRequired: false,
  },
  {
    id: "log-010",
    agentName: "Insurance Compliance",
    action: "Generated TCI deadline warning for Galapagos group",
    timestamp: "2026-03-10T08:00:00Z",
    status: "flagged",
    details:
      "All 6 Galapagos & Antarctica travelers have passed their TCI CFAR eligibility deadlines without purchasing insurance. James Wilson, Linda Wilson, George Whitfield, Martha Whitfield, Robert Martinez, Sandra Martinez. This is a high-value trip ($18K+ per person). Recommend urgent outreach to discuss coverage options.",
    humanReviewRequired: true,
  },

  // === Supplier Health Monitor ===
  {
    id: "log-011",
    agentName: "Supplier Health Monitor",
    action: "Weekly supplier performance analysis",
    timestamp: "2026-03-10T07:00:00Z",
    status: "flagged",
    details:
      "Supplier health report: Patagonia Adventures (sup-001) is significantly underperforming. Avg response: 36hrs vs 24hr SLA. Sentiment: 0.52. 3 incidents this quarter. Rating: 2.8/5. Currently on probation tier. 12 travelers on upcoming Patagonia Explorer depend on this supplier. Recommend immediate supplier review meeting and contingency planning.",
    humanReviewRequired: true,
  },

  // === Follow-up Scheduler ===
  {
    id: "log-012",
    agentName: "Follow-up Scheduler",
    action: "Queued automated follow-up reminders for March 12",
    timestamp: "2026-03-11T20:00:00Z",
    status: "completed",
    details:
      "Scheduled 8 follow-up communications for March 12: Document requests for Victor Reeves (5th attempt), Megan O'Brien (4th attempt), Derek Huang (3rd attempt). Payment reminders for Patricia Moore, Greg Moore. Waiver reminders for Alan Fitzgerald, Thomas Andersson. TCI reminder for George Whitfield.",
    humanReviewRequired: false,
  },
  {
    id: "log-013",
    agentName: "Follow-up Scheduler",
    action: "Escalation triggered for non-responsive travelers",
    timestamp: "2026-03-11T07:30:00Z",
    status: "flagged",
    details:
      "Automatic escalation triggered: Victor Reeves (5 follow-ups, no response), David Morrison (6 follow-ups, no response). Both on Patagonia Explorer departing in 45 days. Recommend coordinator phone calls and alternate contact methods. David Morrison may be a cancellation risk given 82 churn score.",
    humanReviewRequired: true,
  },
  {
    id: "log-014",
    agentName: "Follow-up Scheduler",
    action: "Error sending reminder to Greg Moore",
    timestamp: "2026-03-10T08:30:00Z",
    status: "error",
    details:
      "Failed to send automated document reminder to Greg Moore (con-008) for Tanzania Safari. Email delivery failed with bounce error: mailbox full. Alternate contact method required. Previous 3 emails may also not have been received.",
    humanReviewRequired: true,
  },
];
