import type { Trip } from "@/lib/data/types";
import { staffMembers } from "@/lib/data/seed-staff";
import { suppliers } from "@/lib/data/seed-suppliers";

const sarahChen = staffMembers.find((s) => s.id === "staff-001")!;
const jessicaTorres = staffMembers.find((s) => s.id === "staff-002")!;
const michaelBrooks = staffMembers.find((s) => s.id === "staff-003")!;

const patagoniaAdventures = suppliers.find((s) => s.id === "sup-001")!;
const serengetiExpeditions = suppliers.find((s) => s.id === "sup-002")!;
const sakuraTravel = suppliers.find((s) => s.id === "sup-003")!;
const galapagosMarine = suppliers.find((s) => s.id === "sup-004")!;
const puraVida = suppliers.find((s) => s.id === "sup-005")!;

export const trips: Trip[] = [
  {
    id: "trip-001",
    name: "Patagonia Explorer",
    destination: "Patagonia, Argentina/Chile",
    region: "South America",
    departureDate: "2026-04-26",
    returnDate: "2026-05-10",
    daysUntilDeparture: 45,
    status: "confirmed",
    sugatiPhase: "pre_holiday",
    groupSize: 12,
    maxCapacity: 14,
    assignedGSM: sarahChen,
    assignedRM: michaelBrooks,
    activities: [
      "hiking",
      "rock_climbing",
      "glacier_trekking",
      "wildlife_viewing",
    ],
    supplier: patagoniaAdventures,
    tripReadinessScore: 65,
  },
  {
    id: "trip-002",
    name: "Tanzania Safari",
    destination: "Tanzania, East Africa",
    region: "Africa",
    departureDate: "2026-06-10",
    returnDate: "2026-06-22",
    daysUntilDeparture: 90,
    status: "confirmed",
    sugatiPhase: "booking",
    groupSize: 8,
    maxCapacity: 10,
    assignedGSM: sarahChen,
    assignedRM: michaelBrooks,
    activities: ["safari", "wildlife_viewing", "cultural_tour"],
    supplier: serengetiExpeditions,
    tripReadinessScore: 40,
  },
  {
    id: "trip-003",
    name: "Japan Cultural Journey",
    destination: "Japan",
    region: "Asia",
    departureDate: "2026-05-12",
    returnDate: "2026-05-26",
    daysUntilDeparture: 61,
    status: "confirmed",
    sugatiPhase: "pre_holiday",
    groupSize: 16,
    maxCapacity: 18,
    assignedGSM: jessicaTorres,
    assignedRM: michaelBrooks,
    activities: [
      "cultural_tour",
      "cooking_class",
      "temple_visit",
      "tea_ceremony",
    ],
    supplier: sakuraTravel,
    tripReadinessScore: 80,
  },
  {
    id: "trip-004",
    name: "Galapagos & Antarctica Expedition",
    destination: "Galapagos Islands / Antarctica",
    region: "South America / Antarctica",
    departureDate: "2026-09-15",
    returnDate: "2026-10-05",
    daysUntilDeparture: 187,
    status: "confirmed",
    sugatiPhase: "booking",
    groupSize: 6,
    maxCapacity: 12,
    assignedGSM: jessicaTorres,
    assignedRM: michaelBrooks,
    activities: [
      "snorkeling",
      "kayaking",
      "wildlife_viewing",
      "expedition_cruise",
    ],
    supplier: galapagosMarine,
    tripReadinessScore: 20,
  },
  {
    id: "trip-005",
    name: "Costa Rica Family Adventure",
    destination: "Costa Rica",
    region: "Central America",
    departureDate: "2026-03-27",
    returnDate: "2026-04-05",
    daysUntilDeparture: 15,
    status: "confirmed",
    sugatiPhase: "pre_holiday",
    groupSize: 10,
    maxCapacity: 12,
    assignedGSM: sarahChen,
    assignedRM: michaelBrooks,
    activities: [
      "zip_lining",
      "snorkeling",
      "wildlife_viewing",
      "river_rafting",
    ],
    supplier: puraVida,
    tripReadinessScore: 92,
  },
];
