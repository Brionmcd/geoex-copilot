import type {
  Trip,
  Contact,
  GroupMember,
  Notification,
} from "@/lib/data/types";
import { trips } from "@/lib/data/seed-trips";
import { contacts } from "@/lib/data/seed-contacts";
import { groupMembers } from "@/lib/data/seed-members";
import { notifications } from "@/lib/data/seed-notifications";
import { suppliers } from "@/lib/data/seed-suppliers";
import { staffMembers } from "@/lib/data/seed-staff";

// ─── Helpers ───────────────────────────────────────────────────────

function matchesPartial(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

function daysFromNow(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function monthsFromNow(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return (
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  );
}

// ─── Trip Queries ──────────────────────────────────────────────────

export function searchTrips(filters: {
  destination?: string;
  departing_within_days?: number;
  status?: string;
  min_readiness?: number;
  max_readiness?: number;
  assigned_gsm?: string;
}): Trip[] {
  return trips.filter((trip) => {
    if (
      filters.destination &&
      !matchesPartial(trip.destination, filters.destination) &&
      !matchesPartial(trip.region, filters.destination) &&
      !matchesPartial(trip.name, filters.destination)
    ) {
      return false;
    }
    if (
      filters.departing_within_days !== undefined &&
      trip.daysUntilDeparture > filters.departing_within_days
    ) {
      return false;
    }
    if (
      filters.status &&
      trip.status.toLowerCase() !== filters.status.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.min_readiness !== undefined &&
      trip.tripReadinessScore < filters.min_readiness
    ) {
      return false;
    }
    if (
      filters.max_readiness !== undefined &&
      trip.tripReadinessScore > filters.max_readiness
    ) {
      return false;
    }
    if (
      filters.assigned_gsm &&
      !matchesPartial(trip.assignedGSM.name, filters.assigned_gsm)
    ) {
      return false;
    }
    return true;
  });
}

export function getTripDetail(
  tripId?: string,
  tripName?: string
): {
  trip: Trip;
  members: GroupMember[];
  docCompletionRate: number;
  paymentCompletionRate: number;
  insuranceRate: number;
  alerts: string[];
} | null {
  const trip = tripId
    ? trips.find((t) => t.id === tripId)
    : tripName
      ? trips.find((t) => matchesPartial(t.name, tripName))
      : null;

  if (!trip) return null;

  const members = groupMembers.filter((gm) => gm.tripId === trip.id);
  if (members.length === 0) return { trip, members: [], docCompletionRate: 0, paymentCompletionRate: 0, insuranceRate: 0, alerts: [] };

  const docCompletionRate = Math.round(
    members.reduce((sum, m) => sum + m.documentCompletionPercent, 0) /
      members.length
  );

  const paymentCompletionRate = Math.round(
    (members.filter((m) => m.finalPaymentPaid).length / members.length) * 100
  );

  const insuranceRate = Math.round(
    (members.filter((m) => m.tciPurchased).length / members.length) * 100
  );

  const alerts: string[] = [];

  // Check for missing documents close to departure
  const missingPassports = members.filter((m) => !m.passportSubmitted);
  if (missingPassports.length > 0) {
    alerts.push(
      `${missingPassports.length} traveler(s) missing passport submission: ${missingPassports.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`
    );
  }

  const missingMedical = members.filter((m) => !m.medicalFormSubmitted);
  if (missingMedical.length > 0) {
    alerts.push(
      `${missingMedical.length} traveler(s) missing medical forms: ${missingMedical.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`
    );
  }

  const invalidPassports = members.filter(
    (m) => m.passportSubmitted && !m.passportExpiryValid
  );
  if (invalidPassports.length > 0) {
    alerts.push(
      `${invalidPassports.length} traveler(s) with passport expiry issues: ${invalidPassports.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`
    );
  }

  const missingPayment = members.filter(
    (m) => !m.finalPaymentPaid && !m.depositPaid
  );
  if (missingPayment.length > 0) {
    alerts.push(
      `${missingPayment.length} traveler(s) missing deposit and final payment: ${missingPayment.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`
    );
  }

  const missingInsurance = members.filter((m) => !m.tciPurchased);
  if (missingInsurance.length > 0) {
    alerts.push(
      `${missingInsurance.length} traveler(s) without travel insurance: ${missingInsurance.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`
    );
  }

  // Incomplete waivers
  const incompleteWaivers = members.filter(
    (m) => m.waiversSigned.length < m.waiversRequired.length
  );
  if (incompleteWaivers.length > 0) {
    alerts.push(
      `${incompleteWaivers.length} traveler(s) with incomplete waivers`
    );
  }

  // Supplier concerns
  if (trip.supplier.tier === "probation") {
    alerts.push(
      `Supplier "${trip.supplier.name}" is on probation (rating: ${trip.supplier.rating}, response time: ${trip.supplier.avgResponseTime}h vs ${trip.supplier.slaTarget}h SLA)`
    );
  }

  return {
    trip,
    members,
    docCompletionRate,
    paymentCompletionRate,
    insuranceRate,
    alerts,
  };
}

// ─── Traveler Queries ──────────────────────────────────────────────

export function searchTravelers(filters: {
  name?: string;
  loyalty_tier?: string;
  min_churn_risk?: number;
  trip_id?: string;
  has_missing_documents?: boolean;
  passport_expiring_within_months?: number;
}): (Contact & { trips: string[] })[] {
  // Determine which contact IDs are on which trips
  const contactTrips = new Map<string, string[]>();
  for (const gm of groupMembers) {
    const existing = contactTrips.get(gm.contactId) ?? [];
    const trip = trips.find((t) => t.id === gm.tripId);
    if (trip && !existing.includes(trip.name)) {
      existing.push(trip.name);
    }
    contactTrips.set(gm.contactId, existing);
  }

  // If filtering by trip_id, narrow to contacts on that trip
  let contactIds: Set<string> | null = null;
  if (filters.trip_id) {
    contactIds = new Set(
      groupMembers
        .filter((gm) => gm.tripId === filters.trip_id)
        .map((gm) => gm.contactId)
    );
  }

  // If filtering by missing documents, find contacts who have incomplete docs
  let missingDocContactIds: Set<string> | null = null;
  if (filters.has_missing_documents) {
    missingDocContactIds = new Set(
      groupMembers
        .filter((gm) => gm.documentCompletionPercent < 100)
        .map((gm) => gm.contactId)
    );
  }

  return contacts
    .filter((c) => {
      if (
        filters.name &&
        !matchesPartial(`${c.firstName} ${c.lastName}`, filters.name)
      ) {
        return false;
      }
      if (
        filters.loyalty_tier &&
        c.loyaltyTier.toLowerCase() !== filters.loyalty_tier.toLowerCase()
      ) {
        return false;
      }
      if (
        filters.min_churn_risk !== undefined &&
        c.churnRiskScore < filters.min_churn_risk
      ) {
        return false;
      }
      if (contactIds && !contactIds.has(c.id)) {
        return false;
      }
      if (missingDocContactIds && !missingDocContactIds.has(c.id)) {
        return false;
      }
      if (
        filters.passport_expiring_within_months !== undefined &&
        c.passportExpiry
      ) {
        const months = monthsFromNow(c.passportExpiry);
        if (months > filters.passport_expiring_within_months) {
          return false;
        }
      } else if (
        filters.passport_expiring_within_months !== undefined &&
        !c.passportExpiry
      ) {
        return false;
      }
      return true;
    })
    .map((c) => ({
      ...c,
      trips: contactTrips.get(c.id) ?? [],
    }));
}

export function getCustomerProfile(
  contactId?: string,
  contactName?: string
): {
  contact: Contact;
  tripHistory: { trip: Trip; membership: GroupMember }[];
  healthSignals: {
    metric: string;
    value: string;
    status: "good" | "warning" | "critical";
  }[];
  recommendedActions: string[];
} | null {
  const contact = contactId
    ? contacts.find((c) => c.id === contactId)
    : contactName
      ? contacts.find((c) =>
          matchesPartial(`${c.firstName} ${c.lastName}`, contactName)
        )
      : null;

  if (!contact) return null;

  // Find all group memberships for this contact
  const memberships = groupMembers.filter(
    (gm) => gm.contactId === contact.id
  );
  const tripHistory = memberships
    .map((gm) => {
      const trip = trips.find((t) => t.id === gm.tripId);
      return trip ? { trip, membership: gm } : null;
    })
    .filter(Boolean) as { trip: Trip; membership: GroupMember }[];

  // Health signals
  const healthSignals: {
    metric: string;
    value: string;
    status: "good" | "warning" | "critical";
  }[] = [];

  // Churn risk
  healthSignals.push({
    metric: "Churn Risk Score",
    value: `${contact.churnRiskScore}/100`,
    status:
      contact.churnRiskScore >= 50
        ? "critical"
        : contact.churnRiskScore >= 25
          ? "warning"
          : "good",
  });

  // Email engagement
  healthSignals.push({
    metric: "Email Open Rate",
    value: `${Math.round(contact.emailOpenRate * 100)}%`,
    status:
      contact.emailOpenRate < 0.4
        ? "critical"
        : contact.emailOpenRate < 0.7
          ? "warning"
          : "good",
  });

  // Days since last trip
  if (contact.daysSinceLastTrip !== null) {
    healthSignals.push({
      metric: "Days Since Last Trip",
      value: `${contact.daysSinceLastTrip} days`,
      status:
        contact.daysSinceLastTrip > 365
          ? "critical"
          : contact.daysSinceLastTrip > 180
            ? "warning"
            : "good",
    });
  }

  // LTV
  healthSignals.push({
    metric: "Lifetime Value",
    value: `$${contact.totalLTV.toLocaleString()}`,
    status:
      contact.totalLTV >= 50000
        ? "good"
        : contact.totalLTV >= 20000
          ? "warning"
          : "critical",
  });

  // Referral activity
  healthSignals.push({
    metric: "Referrals",
    value: `${contact.referralCount}`,
    status:
      contact.referralCount >= 3
        ? "good"
        : contact.referralCount >= 1
          ? "warning"
          : "critical",
  });

  // Passport expiry
  if (contact.passportExpiry) {
    const months = monthsFromNow(contact.passportExpiry);
    healthSignals.push({
      metric: "Passport Expiry",
      value: contact.passportExpiry,
      status: months <= 6 ? "critical" : months <= 12 ? "warning" : "good",
    });
  }

  // Recommended actions
  const recommendedActions: string[] = [];

  if (contact.churnRiskScore >= 50) {
    recommendedActions.push(
      "High churn risk - schedule personal outreach call"
    );
  } else if (contact.churnRiskScore >= 25) {
    recommendedActions.push(
      "Moderate churn risk - send personalized re-engagement email"
    );
  }

  if (contact.daysSinceLastTrip && contact.daysSinceLastTrip > 300) {
    recommendedActions.push(
      "Long gap since last trip - consider offering incentive for next booking"
    );
  }

  if (contact.emailOpenRate < 0.5) {
    recommendedActions.push(
      "Low email engagement - try alternate communication channel (phone/text)"
    );
  }

  if (contact.referralCount >= 3) {
    recommendedActions.push(
      "Active referrer - consider for brand ambassador or loyalty program upgrade"
    );
  }

  // Check document completion across active trips
  for (const { trip, membership } of tripHistory) {
    if (membership.documentCompletionPercent < 100) {
      recommendedActions.push(
        `Incomplete documents (${membership.documentCompletionPercent}%) for ${trip.name} - follow up on outstanding items`
      );
    }
    if (!membership.tciPurchased) {
      recommendedActions.push(
        `No travel insurance for ${trip.name} - send TCI reminder`
      );
    }
    if (!membership.finalPaymentPaid && membership.depositPaid) {
      recommendedActions.push(
        `Final payment outstanding for ${trip.name} (due ${membership.finalPaymentDue})`
      );
    }
    if (!membership.depositPaid) {
      recommendedActions.push(
        `No deposit received for ${trip.name} - urgent follow-up required`
      );
    }
  }

  if (contact.passportExpiry) {
    const months = monthsFromNow(contact.passportExpiry);
    if (months <= 6) {
      recommendedActions.push(
        `Passport expires ${contact.passportExpiry} - advise immediate renewal`
      );
    }
  }

  return {
    contact,
    tripHistory,
    healthSignals,
    recommendedActions,
  };
}

// ─── Audit Queries ─────────────────────────────────────────────────

export function runAudit(
  auditType: string,
  tripId?: string
): {
  auditType: string;
  timestamp: string;
  summary: Record<string, unknown>;
  findings: {
    category: string;
    status: string;
    details: string;
    severity: string;
  }[];
  recommendations: string[];
} {
  const now = new Date().toISOString();
  const targetTrips = tripId
    ? trips.filter((t) => t.id === tripId)
    : trips;

  const findings: {
    category: string;
    status: string;
    details: string;
    severity: string;
  }[] = [];
  const recommendations: string[] = [];
  let summary: Record<string, unknown> = {};

  switch (auditType.toLowerCase()) {
    case "document_completion":
    case "documents": {
      let totalMembers = 0;
      let totalComplete = 0;
      let totalMissingPassport = 0;
      let totalMissingMedical = 0;
      let totalMissingWaivers = 0;
      let totalMissingFlight = 0;

      for (const trip of targetTrips) {
        const members = groupMembers.filter((gm) => gm.tripId === trip.id);
        totalMembers += members.length;

        const complete = members.filter(
          (m) => m.documentCompletionPercent === 100
        );
        totalComplete += complete.length;

        const missingPassport = members.filter((m) => !m.passportSubmitted);
        totalMissingPassport += missingPassport.length;
        if (missingPassport.length > 0) {
          findings.push({
            category: "Passport",
            status: "incomplete",
            details: `${trip.name}: ${missingPassport.length} missing passport(s) - ${missingPassport.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`,
            severity:
              trip.daysUntilDeparture <= 30 ? "critical" : "warning",
          });
        }

        const missingMedical = members.filter(
          (m) => !m.medicalFormSubmitted
        );
        totalMissingMedical += missingMedical.length;
        if (missingMedical.length > 0) {
          findings.push({
            category: "Medical Form",
            status: "incomplete",
            details: `${trip.name}: ${missingMedical.length} missing medical form(s) - ${missingMedical.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`,
            severity:
              trip.daysUntilDeparture <= 30 ? "critical" : "warning",
          });
        }

        const incompleteWaivers = members.filter(
          (m) => m.waiversSigned.length < m.waiversRequired.length
        );
        totalMissingWaivers += incompleteWaivers.length;
        if (incompleteWaivers.length > 0) {
          findings.push({
            category: "Waivers",
            status: "incomplete",
            details: `${trip.name}: ${incompleteWaivers.length} traveler(s) with incomplete waivers`,
            severity:
              trip.daysUntilDeparture <= 30 ? "warning" : "info",
          });
        }

        const missingFlight = members.filter(
          (m) => !m.flightDetailsSubmitted
        );
        totalMissingFlight += missingFlight.length;
        if (missingFlight.length > 0) {
          findings.push({
            category: "Flight Details",
            status: "incomplete",
            details: `${trip.name}: ${missingFlight.length} missing flight detail(s)`,
            severity:
              trip.daysUntilDeparture <= 30 ? "warning" : "info",
          });
        }

        // Invalid passports
        const invalidPassports = members.filter(
          (m) => m.passportSubmitted && !m.passportExpiryValid
        );
        if (invalidPassports.length > 0) {
          findings.push({
            category: "Passport Expiry",
            status: "critical",
            details: `${trip.name}: ${invalidPassports.length} passport(s) with expiry issues - ${invalidPassports.map((m) => `${m.contact.firstName} ${m.contact.lastName} (expires ${m.contact.passportExpiry})`).join(", ")}`,
            severity: "critical",
          });
        }
      }

      summary = {
        totalMembers,
        totalComplete,
        completionRate: `${Math.round((totalComplete / totalMembers) * 100)}%`,
        missingPassports: totalMissingPassport,
        missingMedicalForms: totalMissingMedical,
        incompleteWaivers: totalMissingWaivers,
        missingFlightDetails: totalMissingFlight,
      };

      if (totalMissingPassport > 0)
        recommendations.push(
          "Prioritize passport collection for trips departing within 45 days"
        );
      if (totalMissingMedical > 0)
        recommendations.push(
          "Follow up on missing medical forms, especially for travelers with dietary/allergy requirements"
        );
      if (totalMissingWaivers > 0)
        recommendations.push(
          "Send targeted waiver reminders with direct signing links"
        );
      break;
    }

    case "payment_status":
    case "payments": {
      let totalMembers = 0;
      let totalDeposited = 0;
      let totalFinalPaid = 0;
      let totalNoDeposit = 0;

      for (const trip of targetTrips) {
        const members = groupMembers.filter((gm) => gm.tripId === trip.id);
        totalMembers += members.length;

        const deposited = members.filter((m) => m.depositPaid);
        totalDeposited += deposited.length;

        const finalPaid = members.filter((m) => m.finalPaymentPaid);
        totalFinalPaid += finalPaid.length;

        const noDeposit = members.filter((m) => !m.depositPaid);
        totalNoDeposit += noDeposit.length;

        if (noDeposit.length > 0) {
          findings.push({
            category: "Missing Deposit",
            status: "overdue",
            details: `${trip.name}: ${noDeposit.length} traveler(s) without deposit - ${noDeposit.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`,
            severity: "critical",
          });
        }

        const overdueFinal = members.filter(
          (m) =>
            m.depositPaid &&
            !m.finalPaymentPaid &&
            daysFromNow(m.finalPaymentDue) < 0
        );
        if (overdueFinal.length > 0) {
          findings.push({
            category: "Overdue Final Payment",
            status: "overdue",
            details: `${trip.name}: ${overdueFinal.length} overdue final payment(s) - ${overdueFinal.map((m) => `${m.contact.firstName} ${m.contact.lastName} (due ${m.finalPaymentDue})`).join(", ")}`,
            severity: "critical",
          });
        }

        const upcomingFinal = members.filter(
          (m) =>
            m.depositPaid &&
            !m.finalPaymentPaid &&
            daysFromNow(m.finalPaymentDue) >= 0 &&
            daysFromNow(m.finalPaymentDue) <= 30
        );
        if (upcomingFinal.length > 0) {
          findings.push({
            category: "Upcoming Final Payment",
            status: "due_soon",
            details: `${trip.name}: ${upcomingFinal.length} final payment(s) due within 30 days`,
            severity: "warning",
          });
        }
      }

      summary = {
        totalMembers,
        deposited: totalDeposited,
        depositRate: `${Math.round((totalDeposited / totalMembers) * 100)}%`,
        finalPaid: totalFinalPaid,
        finalPaymentRate: `${Math.round((totalFinalPaid / totalMembers) * 100)}%`,
        missingDeposits: totalNoDeposit,
      };

      if (totalNoDeposit > 0)
        recommendations.push(
          "Urgent: Contact travelers without deposits - risk of cancellation"
        );
      break;
    }

    case "insurance_compliance":
    case "insurance": {
      let totalMembers = 0;
      let totalInsured = 0;
      let totalCFAR = 0;
      let totalPastDeadline = 0;
      let totalRipcord = 0;

      for (const trip of targetTrips) {
        const members = groupMembers.filter((gm) => gm.tripId === trip.id);
        totalMembers += members.length;

        const insured = members.filter((m) => m.tciPurchased);
        totalInsured += insured.length;

        const cfar = members.filter((m) => m.tciCFAReligible);
        totalCFAR += cfar.length;

        const ripcord = members.filter((m) => m.ripcordEnrolled);
        totalRipcord += ripcord.length;

        const pastDeadline = members.filter(
          (m) => !m.tciPurchased && daysFromNow(m.tciDeadline) < 0
        );
        totalPastDeadline += pastDeadline.length;

        if (pastDeadline.length > 0) {
          findings.push({
            category: "TCI Deadline Passed",
            status: "expired",
            details: `${trip.name}: ${pastDeadline.length} traveler(s) past TCI CFAR deadline - ${pastDeadline.map((m) => `${m.contact.firstName} ${m.contact.lastName}`).join(", ")}`,
            severity: "warning",
          });
        }

        const uninsured = members.filter((m) => !m.tciPurchased);
        if (uninsured.length > 0) {
          findings.push({
            category: "No Insurance",
            status: "uninsured",
            details: `${trip.name}: ${uninsured.length} traveler(s) without TCI`,
            severity:
              trip.daysUntilDeparture <= 60 ? "critical" : "warning",
          });
        }
      }

      summary = {
        totalMembers,
        insured: totalInsured,
        insuranceRate: `${Math.round((totalInsured / totalMembers) * 100)}%`,
        cfarEligible: totalCFAR,
        ripcordEnrolled: totalRipcord,
        pastCFARDeadline: totalPastDeadline,
      };

      if (totalPastDeadline > 0)
        recommendations.push(
          "Send urgent TCI reminders - standard coverage may still be available even after CFAR deadline"
        );
      if (totalInsured < totalMembers)
        recommendations.push(
          "Review uninsured travelers and send personalized insurance outreach"
        );
      break;
    }

    case "supplier_health":
    case "suppliers": {
      const targetSupplierIds = new Set(
        targetTrips.map((t) => t.supplier.id)
      );
      const relevantSuppliers = suppliers.filter((s) =>
        targetSupplierIds.has(s.id)
      );

      for (const supplier of relevantSuppliers) {
        const relatedTrips = targetTrips.filter(
          (t) => t.supplier.id === supplier.id
        );
        const travelerCount = relatedTrips.reduce(
          (sum, t) => sum + t.groupSize,
          0
        );

        if (supplier.avgResponseTime > supplier.slaTarget) {
          findings.push({
            category: "SLA Breach",
            status: "breaching",
            details: `${supplier.name}: Avg response ${supplier.avgResponseTime}h vs ${supplier.slaTarget}h SLA target. ${travelerCount} travelers affected.`,
            severity: "critical",
          });
        }

        if (supplier.tier === "probation") {
          findings.push({
            category: "Probation Status",
            status: "on_probation",
            details: `${supplier.name}: On probation tier. Rating: ${supplier.rating}/5. ${supplier.incidentCount} incidents.`,
            severity: "critical",
          });
        }

        if (supplier.sentimentScore < 0.7) {
          findings.push({
            category: "Low Sentiment",
            status: "below_threshold",
            details: `${supplier.name}: Sentiment score ${supplier.sentimentScore} (below 0.7 threshold)`,
            severity: "warning",
          });
        }

        if (
          supplier.rating >= 4.5 &&
          supplier.tier === "platinum" &&
          supplier.avgResponseTime <= supplier.slaTarget
        ) {
          findings.push({
            category: "Top Performer",
            status: "excellent",
            details: `${supplier.name}: Rating ${supplier.rating}/5, ${supplier.avgResponseTime}h response time, ${supplier.tier} tier`,
            severity: "info",
          });
        }
      }

      summary = {
        suppliersReviewed: relevantSuppliers.length,
        avgRating:
          Math.round(
            (relevantSuppliers.reduce((sum, s) => sum + s.rating, 0) /
              relevantSuppliers.length) *
              10
          ) / 10,
        slaBreaches: relevantSuppliers.filter(
          (s) => s.avgResponseTime > s.slaTarget
        ).length,
        onProbation: relevantSuppliers.filter((s) => s.tier === "probation")
          .length,
      };

      if (
        relevantSuppliers.some((s) => s.avgResponseTime > s.slaTarget)
      )
        recommendations.push(
          "Schedule supplier review calls for underperforming partners"
        );
      if (relevantSuppliers.some((s) => s.tier === "probation"))
        recommendations.push(
          "Develop contingency plans for trips using probation-tier suppliers"
        );
      break;
    }

    case "readiness":
    case "trip_readiness": {
      for (const trip of targetTrips) {
        const members = groupMembers.filter((gm) => gm.tripId === trip.id);
        const avgReadiness =
          members.length > 0
            ? Math.round(
                members.reduce((sum, m) => sum + m.readinessScore, 0) /
                  members.length
              )
            : 0;

        const lowReadiness = members.filter((m) => m.readinessScore < 50);
        if (lowReadiness.length > 0) {
          findings.push({
            category: "Low Readiness",
            status: "at_risk",
            details: `${trip.name} (departs in ${trip.daysUntilDeparture} days): ${lowReadiness.length} traveler(s) below 50% readiness - ${lowReadiness.map((m) => `${m.contact.firstName} ${m.contact.lastName} (${m.readinessScore}%)`).join(", ")}`,
            severity:
              trip.daysUntilDeparture <= 30 ? "critical" : "warning",
          });
        }

        findings.push({
          category: "Trip Readiness",
          status:
            avgReadiness >= 80
              ? "on_track"
              : avgReadiness >= 50
                ? "needs_attention"
                : "at_risk",
          details: `${trip.name}: ${avgReadiness}% avg readiness, ${trip.daysUntilDeparture} days to departure, ${members.length}/${trip.maxCapacity} capacity`,
          severity:
            avgReadiness < 50 && trip.daysUntilDeparture <= 60
              ? "critical"
              : avgReadiness < 70
                ? "warning"
                : "info",
        });
      }

      summary = {
        tripsAudited: targetTrips.length,
        tripsOnTrack: targetTrips.filter((t) => t.tripReadinessScore >= 80)
          .length,
        tripsNeedingAttention: targetTrips.filter(
          (t) =>
            t.tripReadinessScore >= 50 && t.tripReadinessScore < 80
        ).length,
        tripsAtRisk: targetTrips.filter((t) => t.tripReadinessScore < 50)
          .length,
      };

      recommendations.push(
        "Focus resources on trips departing soonest with lowest readiness scores"
      );
      break;
    }

    default: {
      // Full audit - run all categories
      const docAudit = runAudit("documents", tripId);
      const paymentAudit = runAudit("payments", tripId);
      const insuranceAudit = runAudit("insurance", tripId);
      const supplierAudit = runAudit("suppliers", tripId);
      const readinessAudit = runAudit("readiness", tripId);

      return {
        auditType: "comprehensive",
        timestamp: now,
        summary: {
          documents: docAudit.summary,
          payments: paymentAudit.summary,
          insurance: insuranceAudit.summary,
          suppliers: supplierAudit.summary,
          readiness: readinessAudit.summary,
        },
        findings: [
          ...docAudit.findings,
          ...paymentAudit.findings,
          ...insuranceAudit.findings,
          ...supplierAudit.findings,
          ...readinessAudit.findings,
        ],
        recommendations: [
          ...docAudit.recommendations,
          ...paymentAudit.recommendations,
          ...insuranceAudit.recommendations,
          ...supplierAudit.recommendations,
          ...readinessAudit.recommendations,
        ],
      };
    }
  }

  return {
    auditType,
    timestamp: now,
    summary,
    findings,
    recommendations,
  };
}

// ─── Notification Queries ──────────────────────────────────────────

export function getNotifications(filters: {
  type?: string;
  unread_only?: boolean;
  severity?: string;
}): Notification[] {
  return notifications.filter((n) => {
    if (filters.type && n.type !== filters.type) return false;
    if (filters.unread_only && n.read) return false;
    if (
      filters.severity &&
      n.severity.toLowerCase() !== filters.severity.toLowerCase()
    )
      return false;
    return true;
  });
}

// ─── Follow-Up Generation ──────────────────────────────────────────

export function generateFollowUp(params: {
  group_member_id?: string;
  contact_name?: string;
  trip_name?: string;
  communication_type: string;
  focus: string;
}): { to: string; subject?: string; body: string; type: string } {
  // Resolve the contact and membership
  let member: GroupMember | undefined;
  let contact: Contact | undefined;
  let trip: Trip | undefined;

  if (params.group_member_id) {
    member = groupMembers.find((gm) => gm.id === params.group_member_id);
    if (member) {
      contact = member.contact;
      trip = trips.find((t) => t.id === member!.tripId);
    }
  } else if (params.contact_name) {
    contact = contacts.find((c) =>
      matchesPartial(
        `${c.firstName} ${c.lastName}`,
        params.contact_name!
      )
    );
    if (contact && params.trip_name) {
      trip = trips.find((t) => matchesPartial(t.name, params.trip_name!));
      if (trip) {
        member = groupMembers.find(
          (gm) => gm.contactId === contact!.id && gm.tripId === trip!.id
        );
      }
    } else if (contact) {
      // Find their most upcoming trip
      const memberships = groupMembers
        .filter((gm) => gm.contactId === contact!.id)
        .map((gm) => ({
          gm,
          trip: trips.find((t) => t.id === gm.tripId),
        }))
        .filter((m) => m.trip)
        .sort(
          (a, b) =>
            a.trip!.daysUntilDeparture - b.trip!.daysUntilDeparture
        );
      if (memberships.length > 0) {
        member = memberships[0].gm;
        trip = memberships[0].trip;
      }
    }
  }

  if (!contact) {
    return {
      to: "unknown",
      subject: "Follow-up",
      body: "Could not find the specified contact. Please provide a valid contact name or group member ID.",
      type: params.communication_type,
    };
  }

  const firstName = contact.firstName;
  const tripName = trip?.name ?? "your upcoming trip";
  const daysOut = trip?.daysUntilDeparture ?? 0;
  const focus = params.focus.toLowerCase();

  let subject = "";
  let body = "";

  if (focus.includes("document") || focus.includes("passport") || focus.includes("medical") || focus.includes("waiver")) {
    const missingItems: string[] = [];
    if (member && !member.passportSubmitted) missingItems.push("passport copy");
    if (member && !member.medicalFormSubmitted) missingItems.push("medical form");
    if (member && member.waiversSigned.length < member.waiversRequired.length) {
      const unsigned = member.waiversRequired.filter(
        (w) => !member!.waiversSigned.includes(w)
      );
      missingItems.push(...unsigned.map((w) => w.replace(/_/g, " ")));
    }
    if (member && !member.flightDetailsSubmitted) missingItems.push("flight details");

    subject = `Action Required: Outstanding documents for ${tripName}`;
    body = `Hi ${firstName},\n\nI hope you're getting excited about ${tripName}${trip ? ` departing ${trip.departureDate}` : ""}! We're ${daysOut} days from departure and want to make sure everything is in order for a smooth trip.\n\nWe still need the following from you:\n${missingItems.map((item) => `  - ${item.charAt(0).toUpperCase() + item.slice(1)}`).join("\n")}\n\nCould you please submit these at your earliest convenience? If you have any questions about what's needed, don't hesitate to reach out.\n\nWarm regards,\nGeoEx Travel Team`;
  } else if (focus.includes("payment")) {
    const depositOwed = member && !member.depositPaid;
    const finalOwed = member && member.depositPaid && !member.finalPaymentPaid;

    subject = `Payment Reminder: ${tripName}`;
    if (depositOwed) {
      body = `Hi ${firstName},\n\nWe wanted to follow up regarding your deposit for ${tripName}. We haven't yet received your deposit payment, and we want to ensure your spot is secured.\n\nPlease submit your deposit at your earliest convenience. If you need to discuss payment options or a payment plan, we're happy to help.\n\nBest regards,\nGeoEx Travel Team`;
    } else if (finalOwed) {
      body = `Hi ${firstName},\n\nThis is a friendly reminder that the final payment for ${tripName} is due ${member?.finalPaymentDue ?? "soon"}. We're ${daysOut} days from departure and want to make sure everything is finalized.\n\nPlease submit your final payment at your earliest convenience. If you have any questions about the payment process, please don't hesitate to reach out.\n\nBest regards,\nGeoEx Travel Team`;
    } else {
      body = `Hi ${firstName},\n\nThank you for staying on top of your payments for ${tripName}. We appreciate your promptness and look forward to an amazing trip!\n\nBest regards,\nGeoEx Travel Team`;
    }
  } else if (focus.includes("insurance") || focus.includes("tci")) {
    subject = `Travel Insurance Reminder: ${tripName}`;
    const pastDeadline = member && daysFromNow(member.tciDeadline) < 0;
    body = `Hi ${firstName},\n\nWe noticed you haven't yet purchased travel insurance for ${tripName}. ${pastDeadline ? "While the Cancel For Any Reason (CFAR) eligibility window has passed, standard travel coverage is still available and highly recommended." : "We strongly recommend purchasing Travel Cancellation Insurance (TCI) before your eligibility deadline."}\n\nTravel insurance provides important protection for your investment and peace of mind. We recommend reviewing your options at your earliest convenience.\n\nBest regards,\nGeoEx Travel Team`;
  } else if (focus.includes("re-engage") || focus.includes("churn") || focus.includes("winback")) {
    subject = `We miss you, ${firstName}! Let's plan your next adventure`;
    body = `Hi ${firstName},\n\nIt's been a while since your last GeoEx trip, and we've been thinking about you! We have some exciting new destinations and itineraries that we think would be perfect based on your travel style.\n\nWould you be open to a quick call to chat about what's new? We'd love to help you plan your next adventure.\n\nWarm regards,\nGeoEx Travel Team`;
  } else {
    subject = `Update: ${tripName}`;
    body = `Hi ${firstName},\n\nI wanted to reach out regarding ${tripName}. Please let me know if you have any questions or if there's anything I can help with as we prepare for your upcoming trip.\n\nBest regards,\nGeoEx Travel Team`;
  }

  return {
    to: contact.email,
    subject,
    body,
    type: params.communication_type,
  };
}

// ─── Aggregate Metrics ─────────────────────────────────────────────

export function getAggregateMetrics(
  metric: string,
  groupBy: string
): {
  metric: string;
  groupBy: string;
  data: { label: string; value: number; [key: string]: unknown }[];
} {
  const data: { label: string; value: number; [key: string]: unknown }[] = [];

  switch (metric.toLowerCase()) {
    case "readiness":
    case "trip_readiness": {
      if (groupBy === "trip" || groupBy === "trips") {
        for (const trip of trips) {
          const members = groupMembers.filter((gm) => gm.tripId === trip.id);
          const avgReadiness =
            members.length > 0
              ? Math.round(
                  members.reduce((sum, m) => sum + m.readinessScore, 0) /
                    members.length
                )
              : 0;
          data.push({
            label: trip.name,
            value: avgReadiness,
            daysUntilDeparture: trip.daysUntilDeparture,
            memberCount: members.length,
          });
        }
      }
      break;
    }

    case "document_completion":
    case "documents": {
      if (groupBy === "trip" || groupBy === "trips") {
        for (const trip of trips) {
          const members = groupMembers.filter((gm) => gm.tripId === trip.id);
          const avgCompletion =
            members.length > 0
              ? Math.round(
                  members.reduce(
                    (sum, m) => sum + m.documentCompletionPercent,
                    0
                  ) / members.length
                )
              : 0;
          data.push({
            label: trip.name,
            value: avgCompletion,
            memberCount: members.length,
          });
        }
      } else if (groupBy === "type" || groupBy === "document_type") {
        const allMembers = groupMembers;
        const total = allMembers.length;
        data.push({
          label: "Passport Submitted",
          value: Math.round(
            (allMembers.filter((m) => m.passportSubmitted).length / total) *
              100
          ),
        });
        data.push({
          label: "Medical Form Submitted",
          value: Math.round(
            (allMembers.filter((m) => m.medicalFormSubmitted).length /
              total) *
              100
          ),
        });
        data.push({
          label: "All Waivers Signed",
          value: Math.round(
            (allMembers.filter(
              (m) => m.waiversSigned.length >= m.waiversRequired.length
            ).length /
              total) *
              100
          ),
        });
        data.push({
          label: "Flight Details",
          value: Math.round(
            (allMembers.filter((m) => m.flightDetailsSubmitted).length /
              total) *
              100
          ),
        });
      }
      break;
    }

    case "payment":
    case "payments": {
      if (groupBy === "trip" || groupBy === "trips") {
        for (const trip of trips) {
          const members = groupMembers.filter((gm) => gm.tripId === trip.id);
          const paidCount = members.filter((m) => m.finalPaymentPaid).length;
          data.push({
            label: trip.name,
            value:
              members.length > 0
                ? Math.round((paidCount / members.length) * 100)
                : 0,
            paidCount,
            totalMembers: members.length,
          });
        }
      } else if (groupBy === "method" || groupBy === "payment_method") {
        const methods = new Map<string, number>();
        for (const m of groupMembers) {
          if (m.paymentMethod) {
            methods.set(
              m.paymentMethod,
              (methods.get(m.paymentMethod) ?? 0) + 1
            );
          }
        }
        Array.from(methods.entries()).forEach(([method, count]) => {
          data.push({ label: method, value: count });
        });
      }
      break;
    }

    case "insurance":
    case "tci": {
      if (groupBy === "trip" || groupBy === "trips") {
        for (const trip of trips) {
          const members = groupMembers.filter((gm) => gm.tripId === trip.id);
          const insuredCount = members.filter((m) => m.tciPurchased).length;
          data.push({
            label: trip.name,
            value:
              members.length > 0
                ? Math.round((insuredCount / members.length) * 100)
                : 0,
            insuredCount,
            totalMembers: members.length,
            cfarEligible: members.filter((m) => m.tciCFAReligible).length,
          });
        }
      }
      break;
    }

    case "churn_risk":
    case "churn": {
      if (groupBy === "tier" || groupBy === "loyalty_tier") {
        const tiers = new Map<string, { total: number; riskSum: number }>();
        for (const c of contacts) {
          const existing = tiers.get(c.loyaltyTier) ?? {
            total: 0,
            riskSum: 0,
          };
          existing.total++;
          existing.riskSum += c.churnRiskScore;
          tiers.set(c.loyaltyTier, existing);
        }
        Array.from(tiers.entries()).forEach(([tier, { total, riskSum }]) => {
          data.push({
            label: tier,
            value: Math.round(riskSum / total),
            contactCount: total,
          });
        });
      } else if (groupBy === "trip" || groupBy === "trips") {
        for (const trip of trips) {
          const members = groupMembers.filter((gm) => gm.tripId === trip.id);
          const contactsOnTrip = members.map((m) => m.contact);
          const avgChurn =
            contactsOnTrip.length > 0
              ? Math.round(
                  contactsOnTrip.reduce(
                    (sum, c) => sum + c.churnRiskScore,
                    0
                  ) / contactsOnTrip.length
                )
              : 0;
          data.push({
            label: trip.name,
            value: avgChurn,
            memberCount: members.length,
          });
        }
      }
      break;
    }

    case "ltv":
    case "lifetime_value": {
      if (groupBy === "tier" || groupBy === "loyalty_tier") {
        const tiers = new Map<string, { total: number; ltvSum: number }>();
        for (const c of contacts) {
          const existing = tiers.get(c.loyaltyTier) ?? {
            total: 0,
            ltvSum: 0,
          };
          existing.total++;
          existing.ltvSum += c.totalLTV;
          tiers.set(c.loyaltyTier, existing);
        }
        Array.from(tiers.entries()).forEach(([tier, { total, ltvSum }]) => {
          data.push({
            label: tier,
            value: Math.round(ltvSum / total),
            contactCount: total,
            totalLTV: ltvSum,
          });
        });
      }
      break;
    }

    case "supplier_performance":
    case "suppliers": {
      if (groupBy === "supplier" || groupBy === "suppliers") {
        for (const supplier of suppliers) {
          data.push({
            label: supplier.name,
            value: supplier.rating,
            responseTime: supplier.avgResponseTime,
            slaTarget: supplier.slaTarget,
            tier: supplier.tier,
            sentimentScore: supplier.sentimentScore,
            incidentCount: supplier.incidentCount,
          });
        }
      }
      break;
    }

    default: {
      // Return empty data for unknown metrics
      break;
    }
  }

  return { metric, groupBy, data };
}
