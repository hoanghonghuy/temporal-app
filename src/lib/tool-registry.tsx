import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type ToolComponent = ComponentType<any>;

export interface ToolDefinition {
  slug: string;
  id: string;
  title: string;
  description: string;
  component: LazyExoticComponent<ToolComponent>;
  supportsInitialDate?: boolean;
}

const DateConverter = lazy(async () => {
  const module = await import("@/components/tools/DateConverter");
  return { default: module.DateConverter };
});

const DateDifferenceCalculator = lazy(async () => {
  const module = await import("@/components/tools/DateDifferenceCalculator");
  return { default: module.DateDifferenceCalculator };
});

const DateCalculator = lazy(async () => {
  const module = await import("@/components/tools/DateCalculator");
  return { default: module.DateCalculator };
});

const AgeCalculator = lazy(async () => {
  const module = await import("@/components/tools/AgeCalculator");
  return { default: module.AgeCalculator };
});

const EventCountdown = lazy(async () => {
  const module = await import("@/components/tools/EventCountdown");
  return { default: module.EventCountdown };
});

const WorkingDaysCalculator = lazy(async () => {
  const module = await import("@/components/tools/WorkingDaysCalculator");
  return { default: module.WorkingDaysCalculator };
});

const LeapYearChecker = lazy(async () => {
  const module = await import("@/components/tools/LeapYearChecker");
  return { default: module.LeapYearChecker };
});

const DayOfWeekFinder = lazy(async () => {
  const module = await import("@/components/tools/DayOfWeekFinder");
  return { default: module.DayOfWeekFinder };
});

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    slug: "date-converter",
    id: "date-converter",
    title: "B\u1ed9 Chuy\u1ec3n \u0110\u1ed5i Ng\u00e0y",
    description: "Xem m\u1ed9t ng\u00e0y d\u01b0\u1edbi nhi\u1ec1u \u0111\u1ecbnh d\u1ea1ng, bao g\u1ed3m c\u1ea3 \u00e2m l\u1ecbch v\u00e0 can chi.",
    component: DateConverter,
    supportsInitialDate: true,
  },
  {
    slug: "date-difference",
    id: "date-difference",
    title: "T\u00ednh Kho\u1ea3ng C\u00e1ch 2 Ng\u00e0y",
    description: "Ch\u1ecdn hai m\u1ed1c th\u1eddi gian \u0111\u1ec3 xem kho\u1ea3ng c\u00e1ch chi ti\u1ebft gi\u1eefa ch\u00fang.",
    component: DateDifferenceCalculator,
  },
  {
    slug: "date-calculator",
    id: "date-calculator",
    title: "Th\u00eam / B\u1edbt Ng\u00e0y",
    description: "T\u00ednh to\u00e1n m\u1ed9t ng\u00e0y trong t\u01b0\u01a1ng lai ho\u1eb7c qu\u00e1 kh\u1ee9 t\u1eeb m\u1ed9t m\u1ed1c th\u1eddi gian.",
    component: DateCalculator,
  },
  {
    slug: "age-calculator",
    id: "age-calculator",
    title: "T\u00ednh Tu\u1ed5i",
    description: "Nh\u1eadp ng\u00e0y sinh c\u1ee7a b\u1ea1n \u0111\u1ec3 t\u00ednh tu\u1ed5i ch\u00ednh x\u00e1c \u0111\u1ebfn t\u1eebng ng\u00e0y.",
    component: AgeCalculator,
  },
  {
    slug: "event-countdown",
    id: "event-countdown",
    title: "\u0110\u1ebfm Ng\u01b0\u1ee3c S\u1ef1 Ki\u1ec7n",
    description: "Ch\u1ecdn m\u1ed9t ng\u00e0y v\u00e0 xem th\u1eddi gian c\u00f2n l\u1ea1i \u0111\u1ebfn cu\u1ed1i ng\u00e0y \u0111\u00f3.",
    component: EventCountdown,
  },
  {
    slug: "working-days-calculator",
    id: "working-days-calculator",
    title: "T\u00ednh Ng\u00e0y L\u00e0m Vi\u1ec7c",
    description: "T\u00ednh s\u1ed1 ng\u00e0y l\u00e0m vi\u1ec7c gi\u1eefa hai m\u1ed1c th\u1eddi gian, t\u1ef1 \u0111\u1ed9ng lo\u1ea1i tr\u1eeb cu\u1ed1i tu\u1ea7n v\u00e0 ng\u00e0y l\u1ec5.",
    component: WorkingDaysCalculator,
  },
  {
    slug: "leap-year",
    id: "leap-year",
    title: "Ki\u1ec3m Tra N\u0103m Nhu\u1eadn",
    description: "Nh\u1eadp m\u1ed9t n\u0103m \u0111\u1ec3 ki\u1ec3m tra xem \u0111\u00f3 c\u00f3 ph\u1ea3i l\u00e0 n\u0103m nhu\u1eadn d\u01b0\u01a1ng l\u1ecbch hay kh\u00f4ng.",
    component: LeapYearChecker,
  },
  {
    slug: "day-of-week-finder",
    id: "day-of-week-finder",
    title: "T\u00ecm Th\u1ee9 Trong Tu\u1ea7n",
    description: "Ch\u1ecdn m\u1ed9t ng\u00e0y b\u1ea5t k\u1ef3 \u0111\u1ec3 bi\u1ebft ch\u00ednh x\u00e1c \u0111\u00f3 l\u00e0 th\u1ee9 m\u1ea5y.",
    component: DayOfWeekFinder,
  },
];

export const TOOL_BY_SLUG = new Map(TOOL_DEFINITIONS.map((tool) => [tool.slug, tool]));
export const TOOL_BY_ID = new Map(TOOL_DEFINITIONS.map((tool) => [tool.id, tool]));
