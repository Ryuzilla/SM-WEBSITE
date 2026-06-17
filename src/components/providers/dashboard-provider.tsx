"use client";

import * as React from "react";
import { buildAnalytics } from "@/lib/analytics";
import {
  AnalyticsBundle,
  DashboardFilters,
  EMPTY_FILTERS,
  SalesRecord,
  UserProfile,
} from "@/lib/types";

interface DashboardContextValue {
  profile: UserProfile;
  filters: DashboardFilters;
  setFilter: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) => void;
  resetFilters: () => void;
  analytics: AnalyticsBundle;
  activeFilterCount: number;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  profile,
  records,
  children,
}: {
  profile: UserProfile;
  records: SalesRecord[];
  children: React.ReactNode;
}) {
  const [filters, setFilters] = React.useState<DashboardFilters>(EMPTY_FILTERS);

  const setFilter = React.useCallback(
    <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetFilters = React.useCallback(() => setFilters(EMPTY_FILTERS), []);

  // Recompute the full analytics bundle whenever filters change. Memoized so
  // unrelated re-renders don't re-run the aggregation.
  const analytics = React.useMemo(
    () => buildAnalytics(records, filters),
    [records, filters],
  );

  const activeFilterCount = React.useMemo(
    () => Object.values(filters).filter((v) => v !== null).length,
    [filters],
  );

  const value: DashboardContextValue = {
    profile,
    filters,
    setFilter,
    resetFilters,
    analytics,
    activeFilterCount,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}
