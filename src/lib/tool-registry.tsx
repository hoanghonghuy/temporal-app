import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { DICTIONARIES, type AppLocale, type ToolId } from "@/i18n/dictionary";

type ToolComponent = ComponentType<any>;

interface ToolDefinitionBase {
  slug: string;
  id: ToolId;
  component: LazyExoticComponent<ToolComponent>;
  supportsInitialDate?: boolean;
}

interface ToolCopy {
  title: string;
  description: string;
}

export interface ToolDefinition extends ToolDefinitionBase, ToolCopy {}

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

const TOOL_BASE_DEFINITIONS: ToolDefinitionBase[] = [
  {
    slug: "date-converter",
    id: "date-converter",
    component: DateConverter,
    supportsInitialDate: true,
  },
  {
    slug: "date-difference",
    id: "date-difference",
    component: DateDifferenceCalculator,
  },
  {
    slug: "date-calculator",
    id: "date-calculator",
    component: DateCalculator,
  },
  {
    slug: "age-calculator",
    id: "age-calculator",
    component: AgeCalculator,
  },
  {
    slug: "event-countdown",
    id: "event-countdown",
    component: EventCountdown,
    supportsInitialDate: true,
  },
  {
    slug: "working-days-calculator",
    id: "working-days-calculator",
    component: WorkingDaysCalculator,
  },
  {
    slug: "leap-year",
    id: "leap-year",
    component: LeapYearChecker,
  },
  {
    slug: "day-of-week-finder",
    id: "day-of-week-finder",
    component: DayOfWeekFinder,
  },
];

export function getToolDefinitions(locale: AppLocale): ToolDefinition[] {
  const copy = DICTIONARIES[locale].toolMeta as Record<ToolId, ToolCopy>;

  return TOOL_BASE_DEFINITIONS.map((tool) => ({
    ...tool,
    title: copy[tool.id].title,
    description: copy[tool.id].description,
  }));
}

export function getToolMaps(locale: AppLocale) {
  const definitions = getToolDefinitions(locale);

  return {
    definitions,
    bySlug: new Map<string, ToolDefinition>(definitions.map((tool) => [tool.slug, tool])),
    byId: new Map<string, ToolDefinition>(definitions.map((tool) => [tool.id, tool])),
  };
}
