export const toolDefinitions = [
  {
    name: "search_trips",
    description:
      "Search for trips by destination, departure window, status, readiness score, or assigned GSM. Returns matching trips with key details.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description:
            "Filter by destination, region, or trip name (partial match, case-insensitive)",
        },
        departing_within_days: {
          type: "number",
          description:
            "Only return trips departing within this many days from now",
        },
        status: {
          type: "string",
          enum: ["confirmed", "pending", "cancelled"],
          description: "Filter by trip status",
        },
        min_readiness: {
          type: "number",
          description:
            "Minimum trip readiness score (0-100)",
        },
        max_readiness: {
          type: "number",
          description:
            "Maximum trip readiness score (0-100)",
        },
        assigned_gsm: {
          type: "string",
          description:
            "Filter by assigned GSM name (partial match, case-insensitive)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_trip_detail",
    description:
      "Get detailed information about a specific trip including all group members, document completion rates, payment status, insurance coverage, and active alerts. Provide either tripId or tripName.",
    input_schema: {
      type: "object" as const,
      properties: {
        trip_id: {
          type: "string",
          description: "The trip ID (e.g., 'trip-001')",
        },
        trip_name: {
          type: "string",
          description:
            "The trip name to search for (partial match, case-insensitive)",
        },
      },
      required: [],
    },
  },
  {
    name: "search_travelers",
    description:
      "Search for travelers/contacts by name, loyalty tier, churn risk, trip membership, document status, or passport expiry. Returns matching contacts with their trip associations.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "Search by traveler name (partial match, case-insensitive)",
        },
        loyalty_tier: {
          type: "string",
          enum: [
            "champion",
            "power_couple",
            "family",
            "solo_adventurer",
            "bucket_lister",
            "at_risk",
          ],
          description: "Filter by loyalty tier",
        },
        min_churn_risk: {
          type: "number",
          description:
            "Minimum churn risk score (0-100) to filter for at-risk travelers",
        },
        trip_id: {
          type: "string",
          description:
            "Only return travelers assigned to this trip ID",
        },
        has_missing_documents: {
          type: "boolean",
          description:
            "If true, only return travelers with incomplete documentation on at least one trip",
        },
        passport_expiring_within_months: {
          type: "number",
          description:
            "Only return travelers whose passport expires within this many months",
        },
      },
      required: [],
    },
  },
  {
    name: "get_customer_profile",
    description:
      "Get a comprehensive customer profile including trip history, health signals (churn risk, engagement, LTV), and recommended actions. Provide either contactId or contactName.",
    input_schema: {
      type: "object" as const,
      properties: {
        contact_id: {
          type: "string",
          description: "The contact ID (e.g., 'con-001')",
        },
        contact_name: {
          type: "string",
          description:
            "The contact name to search for (partial match, case-insensitive)",
        },
      },
      required: [],
    },
  },
  {
    name: "run_audit",
    description:
      "Run a compliance audit across trips. Audit types: 'documents' (passport, medical, waivers, flight details), 'payments' (deposits, final payments, overdue), 'insurance' (TCI coverage, CFAR eligibility), 'suppliers' (SLA compliance, ratings, incidents), 'readiness' (overall trip readiness), or 'comprehensive' (all categories). Optionally scope to a specific trip.",
    input_schema: {
      type: "object" as const,
      properties: {
        audit_type: {
          type: "string",
          enum: [
            "documents",
            "document_completion",
            "payments",
            "payment_status",
            "insurance",
            "insurance_compliance",
            "suppliers",
            "supplier_health",
            "readiness",
            "trip_readiness",
            "comprehensive",
          ],
          description: "The type of audit to run",
        },
        trip_id: {
          type: "string",
          description:
            "Optional trip ID to scope the audit to a specific trip",
        },
      },
      required: ["audit_type"],
    },
  },
  {
    name: "get_notifications",
    description:
      "Get system notifications filtered by type, read status, or severity. Notifications include document alerts, payment deadlines, system warnings, agent activity, and supplier alerts.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: [
            "document_alert",
            "payment_deadline",
            "system_warning",
            "agent_activity",
            "supplier_alert",
          ],
          description: "Filter by notification type",
        },
        unread_only: {
          type: "boolean",
          description: "If true, only return unread notifications",
        },
        severity: {
          type: "string",
          enum: ["critical", "warning", "info"],
          description: "Filter by severity level",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_follow_up",
    description:
      "Generate a follow-up communication (email, call script, or text) for a specific traveler. Tailored to the traveler's situation, loyalty tier, and the specified focus area (documents, payment, insurance, re-engagement).",
    input_schema: {
      type: "object" as const,
      properties: {
        group_member_id: {
          type: "string",
          description:
            "The group member ID for the specific trip membership (e.g., 'gm-001')",
        },
        contact_name: {
          type: "string",
          description:
            "The contact name (used if group_member_id not provided)",
        },
        trip_name: {
          type: "string",
          description:
            "The trip name to scope the follow-up to (optional, uses soonest trip if omitted)",
        },
        communication_type: {
          type: "string",
          enum: ["email", "call_script", "text_message"],
          description: "The type of communication to generate",
        },
        focus: {
          type: "string",
          description:
            "The focus area: 'documents', 'payment', 'insurance', 'tci', 're-engage', 'winback', 'general'",
        },
      },
      required: ["communication_type", "focus"],
    },
  },
  {
    name: "get_aggregate_metrics",
    description:
      "Get aggregate metrics across trips, travelers, or suppliers. Metrics: 'readiness', 'documents', 'payments', 'insurance', 'churn_risk', 'ltv', 'supplier_performance'. Group by: 'trip', 'tier', 'type', 'method', 'supplier'.",
    input_schema: {
      type: "object" as const,
      properties: {
        metric: {
          type: "string",
          enum: [
            "readiness",
            "trip_readiness",
            "documents",
            "document_completion",
            "payments",
            "payment",
            "insurance",
            "tci",
            "churn_risk",
            "churn",
            "ltv",
            "lifetime_value",
            "supplier_performance",
            "suppliers",
          ],
          description: "The metric to aggregate",
        },
        group_by: {
          type: "string",
          enum: [
            "trip",
            "trips",
            "tier",
            "loyalty_tier",
            "type",
            "document_type",
            "method",
            "payment_method",
            "supplier",
            "suppliers",
          ],
          description: "How to group the metric results",
        },
      },
      required: ["metric", "group_by"],
    },
  },
];
