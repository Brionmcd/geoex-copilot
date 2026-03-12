import type { Notification } from "@/lib/data/types";

export const notifications: Notification[] = [
  // === CRITICAL (3) ===
  {
    id: "notif-001",
    type: "document_alert",
    severity: "critical",
    title: "Missing medical form for minor - Costa Rica departs in 15 days",
    message:
      "Tyler Thompson (age 12, peanut allergy) is missing his medical form for the Costa Rica Family Adventure departing March 27. This is a critical safety requirement for a minor with a known food allergy. Parent contact: Susan Thompson.",
    timestamp: "2026-03-11T09:15:00Z",
    read: false,
    actionable: true,
    suggestedAction:
      "Call Susan Thompson at +1-720-555-0413 to request immediate medical form submission for Tyler. Emphasize peanut allergy documentation requirement.",
    relatedTripId: "trip-005",
    relatedContactId: "con-012",
  },
  {
    id: "notif-002",
    type: "supplier_alert",
    severity: "critical",
    title: "Patagonia Adventures SLA breach - 36hr response time exceeded",
    message:
      "Patagonia Adventures has averaged 36-hour response times over the past 30 days, exceeding their 24-hour SLA target. This is their 3rd incident this quarter. Supplier is on probation tier. 12 travelers depend on this supplier for the April 26 departure.",
    timestamp: "2026-03-11T14:30:00Z",
    read: false,
    actionable: true,
    suggestedAction:
      "Escalate to Michael Brooks (RM). Schedule supplier review call with Carlos Mendez. Consider contingency planning for Patagonia trip logistics.",
    relatedTripId: "trip-001",
    relatedContactId: null,
  },
  {
    id: "notif-003",
    type: "document_alert",
    severity: "critical",
    title: "2 passports expiring within 6 months of Tanzania departure",
    message:
      "Lawrence Grant (passport expires 2026-09-15) and Beverly Hayes (passport expires 2026-08-20) have passports that will be within 6 months of expiry at the time of the Tanzania Safari departure on June 10, 2026. Most East African countries require 6+ months passport validity.",
    timestamp: "2026-03-10T11:00:00Z",
    read: true,
    actionable: true,
    suggestedAction:
      "Contact Lawrence Grant and Beverly Hayes immediately to begin passport renewal process. Estimated processing time: 6-8 weeks standard, 2-3 weeks expedited.",
    relatedTripId: "trip-002",
    relatedContactId: null,
  },

  // === WARNING (6) ===
  {
    id: "notif-004",
    type: "payment_deadline",
    severity: "warning",
    title: "TCI deadline approaching for 3 Galapagos travelers",
    message:
      "James Wilson, Linda Wilson, and George & Martha Whitfield have passed their TCI purchase deadlines for the Galapagos & Antarctica Expedition without purchasing travel insurance. They are no longer eligible for Cancel For Any Reason coverage. Standard TCI may still be available.",
    timestamp: "2026-03-10T08:00:00Z",
    read: true,
    actionable: true,
    suggestedAction:
      "Send TCI reminder emails to James Wilson, Linda Wilson, George Whitfield, and Martha Whitfield. Emphasize that CFAR eligibility has lapsed but standard coverage is still available.",
    relatedTripId: "trip-004",
    relatedContactId: null,
  },
  {
    id: "notif-005",
    type: "system_warning",
    severity: "warning",
    title: "David Morrison 571 days inactive - churn risk high (82)",
    message:
      "David Morrison has not traveled in 571 days (last trip: July 2024). His churn risk score is 82/100. Email open rate has declined to 32%. He previously expressed interest in a Tanzania safari. He is currently listed on the Patagonia trip but has not submitted any documents or payments.",
    timestamp: "2026-03-09T10:30:00Z",
    read: true,
    actionable: true,
    suggestedAction:
      "Personal outreach recommended. Consider a phone call from Sarah Chen (GSM). Offer a personalized trip consultation or incentive to re-engage.",
    relatedTripId: null,
    relatedContactId: "con-013",
  },
  {
    id: "notif-006",
    type: "document_alert",
    severity: "warning",
    title: "4 travelers haven't responded to document requests (7+ days)",
    message:
      "Victor Reeves (Patagonia, 5 follow-ups), David Morrison (Patagonia, 6 follow-ups), Greg Moore (Tanzania, 4 follow-ups), and Brandon Reese (Japan, 3 follow-ups) have not responded to document collection requests for over 7 days despite multiple follow-ups.",
    timestamp: "2026-03-11T07:45:00Z",
    read: false,
    actionable: true,
    suggestedAction:
      "Escalate to coordinator calls. Victor Reeves and David Morrison on Patagonia are most urgent (45 days to departure). Consider alternate contact methods (phone call, text).",
    relatedTripId: null,
    relatedContactId: null,
  },
  {
    id: "notif-007",
    type: "payment_deadline",
    severity: "warning",
    title: "Final payment overdue for 2 Tanzania travelers",
    message:
      "Patricia Moore and Greg Moore have not submitted deposits for the Tanzania Safari. Final payment deadline is April 10, 2026. Patricia has been contacted 2 times and Greg 4 times without payment submission.",
    timestamp: "2026-03-10T16:00:00Z",
    read: true,
    actionable: true,
    suggestedAction:
      "Contact Patricia Moore directly - she is the primary family contact. Offer payment plan options if needed. Deadline: April 10, 2026.",
    relatedTripId: "trip-002",
    relatedContactId: "con-007",
  },
  {
    id: "notif-008",
    type: "document_alert",
    severity: "warning",
    title: "Patagonia rock climbing waivers incomplete for 5 travelers",
    message:
      "The rock climbing supplemental release waiver is required for all Patagonia Explorer participants but has not been signed by: Derek Huang, Megan O'Brien, Victor Reeves, Alan Fitzgerald, and Thomas Andersson. Trip departs in 45 days.",
    timestamp: "2026-03-11T10:00:00Z",
    read: false,
    actionable: true,
    suggestedAction:
      "Send targeted waiver reminder to the 5 travelers. Include direct signing link. Flag that rock climbing participation requires this waiver.",
    relatedTripId: "trip-001",
    relatedContactId: null,
  },
  {
    id: "notif-009",
    type: "payment_deadline",
    severity: "warning",
    title: "Japan trip final payment deadline is today",
    message:
      "4 Japan Cultural Journey travelers have not submitted final payment: Brandon Reese, Priya Sharma, Margaret Chen, and Howard Chen. The final payment deadline is March 12, 2026.",
    timestamp: "2026-03-12T06:00:00Z",
    read: false,
    actionable: true,
    suggestedAction:
      "Send urgent payment reminders. Margaret and Howard Chen are repeat travelers - personal call from Jessica Torres recommended. Brandon Reese and Priya Sharma may need payment plan discussion.",
    relatedTripId: "trip-003",
    relatedContactId: null,
  },

  // === INFO (10) ===
  {
    id: "notif-010",
    type: "agent_activity",
    severity: "info",
    title: "Document Collection Tracker completed daily scan",
    message:
      "Automated scan completed for all 5 active trips. 52 group members checked. 38 have complete documentation, 14 have outstanding items. 3 critical issues flagged separately.",
    timestamp: "2026-03-12T06:30:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: null,
    relatedContactId: null,
  },
  {
    id: "notif-011",
    type: "agent_activity",
    severity: "info",
    title: "Payment Monitor processed 3 new payments",
    message:
      "Received and verified final payments from: Nathan Cross (Japan, credit card), Irene Kowalski (Japan, wire transfer), and Lisa Bergman (Japan, ACH). All matched expected amounts.",
    timestamp: "2026-03-11T15:20:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: "trip-003",
    relatedContactId: null,
  },
  {
    id: "notif-012",
    type: "document_alert",
    severity: "info",
    title: "Passport submission received - Catherine Dubois",
    message:
      "Catherine Dubois submitted her French passport for the Patagonia Explorer trip. Passport verified: valid through 2029-11-08. Nationality: France. Document marked as verified.",
    timestamp: "2026-03-10T14:45:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: "trip-001",
    relatedContactId: "con-034",
  },
  {
    id: "notif-013",
    type: "agent_activity",
    severity: "info",
    title: "Welcome emails sent to 2 new Galapagos travelers",
    message:
      "Automated welcome emails sent to George Whitfield and Martha Whitfield for the Galapagos & Antarctica Expedition. Includes document checklist and TCI information.",
    timestamp: "2026-03-09T09:00:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: "trip-004",
    relatedContactId: null,
  },
  {
    id: "notif-014",
    type: "agent_activity",
    severity: "info",
    title: "Follow-up Scheduler queued 8 reminders for tomorrow",
    message:
      "Automated follow-up reminders scheduled for March 12: 3 document requests (Patagonia), 2 payment reminders (Tanzania), 2 waiver reminders (Patagonia), 1 TCI reminder (Galapagos).",
    timestamp: "2026-03-11T20:00:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: null,
    relatedContactId: null,
  },
  {
    id: "notif-015",
    type: "document_alert",
    severity: "info",
    title: "Medical form approved - Margaret Chen (Tanzania)",
    message:
      "Margaret Chen's medical form for the Tanzania Safari has been reviewed and approved. Gluten-free dietary requirement noted and forwarded to Serengeti Expeditions.",
    timestamp: "2026-03-09T13:15:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: "trip-002",
    relatedContactId: "con-003",
  },
  {
    id: "notif-016",
    type: "agent_activity",
    severity: "info",
    title: "System Reconciliation - Sugati vs Smartsheet sync complete",
    message:
      "Daily reconciliation between Sugati and Smartsheet completed. All 5 trips synchronized. 1 minor discrepancy found and auto-resolved: Philip Nakamura flight details timestamp mismatch (2-second delta, corrected).",
    timestamp: "2026-03-12T05:00:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: null,
    relatedContactId: null,
  },
  {
    id: "notif-017",
    type: "agent_activity",
    severity: "info",
    title: "Supplier Health Monitor weekly report generated",
    message:
      "Weekly supplier health report: 4 of 5 suppliers meeting SLA targets. Patagonia Adventures flagged (see critical alert). Serengeti Expeditions and Galapagos Marine Adventures performing above expectations.",
    timestamp: "2026-03-10T07:00:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: null,
    relatedContactId: null,
  },
  {
    id: "notif-018",
    type: "agent_activity",
    severity: "info",
    title: "Costa Rica trip readiness at 92% - nearly departure-ready",
    message:
      "Costa Rica Family Adventure readiness score: 92%. Only outstanding item: Tyler Thompson medical form. All payments received, all other documents and waivers complete for 10 travelers.",
    timestamp: "2026-03-11T12:00:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: "trip-005",
    relatedContactId: null,
  },
  {
    id: "notif-019",
    type: "agent_activity",
    severity: "info",
    title: "Insurance Compliance check completed",
    message:
      "TCI compliance scan: 34 of 52 travelers have purchased travel insurance. 6 Galapagos travelers past CFAR deadline. 4 Patagonia travelers and 4 Tanzania travelers still within purchase window.",
    timestamp: "2026-03-11T06:45:00Z",
    read: true,
    actionable: false,
    suggestedAction: null,
    relatedTripId: null,
    relatedContactId: null,
  },
];
