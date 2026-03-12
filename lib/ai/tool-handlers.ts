import {
  searchTrips,
  getTripDetail,
  searchTravelers,
  getCustomerProfile,
  runAudit,
  getNotifications,
  generateFollowUp,
  getAggregateMetrics,
} from "@/lib/data/queries";

export function handleToolCall(
  name: string,
  input: Record<string, unknown>
): string {
  switch (name) {
    case "search_trips": {
      const result = searchTrips({
        destination: input.destination as string | undefined,
        departing_within_days: input.departing_within_days as
          | number
          | undefined,
        status: input.status as string | undefined,
        min_readiness: input.min_readiness as number | undefined,
        max_readiness: input.max_readiness as number | undefined,
        assigned_gsm: input.assigned_gsm as string | undefined,
      });
      return JSON.stringify(result);
    }

    case "get_trip_detail": {
      const result = getTripDetail(
        input.trip_id as string | undefined,
        input.trip_name as string | undefined
      );
      return JSON.stringify(result);
    }

    case "search_travelers": {
      const result = searchTravelers({
        name: input.name as string | undefined,
        loyalty_tier: input.loyalty_tier as string | undefined,
        min_churn_risk: input.min_churn_risk as number | undefined,
        trip_id: input.trip_id as string | undefined,
        has_missing_documents: input.has_missing_documents as
          | boolean
          | undefined,
        passport_expiring_within_months:
          input.passport_expiring_within_months as number | undefined,
      });
      return JSON.stringify(result);
    }

    case "get_customer_profile": {
      const result = getCustomerProfile(
        input.contact_id as string | undefined,
        input.contact_name as string | undefined
      );
      return JSON.stringify(result);
    }

    case "run_audit": {
      const result = runAudit(
        input.audit_type as string,
        input.trip_id as string | undefined
      );
      return JSON.stringify(result);
    }

    case "get_notifications": {
      const result = getNotifications({
        type: input.type as string | undefined,
        unread_only: input.unread_only as boolean | undefined,
        severity: input.severity as string | undefined,
      });
      return JSON.stringify(result);
    }

    case "generate_follow_up": {
      const result = generateFollowUp({
        group_member_id: input.group_member_id as string | undefined,
        contact_name: input.contact_name as string | undefined,
        trip_name: input.trip_name as string | undefined,
        communication_type: input.communication_type as string,
        focus: input.focus as string,
      });
      return JSON.stringify(result);
    }

    case "get_aggregate_metrics": {
      const result = getAggregateMetrics(
        input.metric as string,
        input.group_by as string
      );
      return JSON.stringify(result);
    }

    default:
      return JSON.stringify({
        error: `Unknown tool: ${name}`,
        available_tools: [
          "search_trips",
          "get_trip_detail",
          "search_travelers",
          "get_customer_profile",
          "run_audit",
          "get_notifications",
          "generate_follow_up",
          "get_aggregate_metrics",
        ],
      });
  }
}
