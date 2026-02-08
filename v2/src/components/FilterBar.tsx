"use client";

import { useState } from "react";
import type { ListingFilters } from "@/types/listing";

interface FilterBarProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
  neighborhoods: string[];
  totalCount?: number;
  filteredCount?: number;
}

const PRICE_RANGES = [
  { label: "Any Price", min: undefined, max: undefined },
  { label: "Under $2,000", min: undefined, max: 2000 },
  { label: "$2,000 - $2,500", min: 2000, max: 2500 },
  { label: "$2,500 - $3,000", min: 2500, max: 3000 },
  { label: "$3,000 - $3,500", min: 3000, max: 3500 },
  { label: "$3,500 - $4,000", min: 3500, max: 4000 },
  { label: "$4,000+", min: 4000, max: undefined },
];

const BEDROOM_OPTIONS = [
  { label: "Any Beds", value: null },
  { label: "Studio", value: 0 },
  { label: "1 Bed", value: 1 },
  { label: "2 Beds", value: 2 },
  { label: "3 Beds", value: 3 },
  { label: "4+ Beds", value: 4 },
];

export function FilterBar({
  filters,
  onFiltersChange,
  neighborhoods,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filters.neighborhood,
    filters.minPrice || filters.maxPrice,
    filters.bedrooms !== null && filters.bedrooms !== undefined,
    filters.noFeeOnly,
  ].filter(Boolean).length;

  const handlePriceChange = (value: string) => {
    const range = PRICE_RANGES[parseInt(value)];
    onFiltersChange({
      ...filters,
      minPrice: range.min,
      maxPrice: range.max,
    });
  };

  const handleBedroomChange = (value: string) => {
    const bedroom = BEDROOM_OPTIONS.find((b) => String(b.value) === value);
    onFiltersChange({
      ...filters,
      bedrooms: bedroom?.value,
    });
  };

  const handleNeighborhoodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      neighborhood: value || undefined,
    });
  };

  const handleNoFeeToggle = () => {
    onFiltersChange({
      ...filters,
      noFeeOnly: !filters.noFeeOnly,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const currentPriceIndex = PRICE_RANGES.findIndex(
    (r) => r.min === filters.minPrice && r.max === filters.maxPrice
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Neighborhood dropdown */}
        <select
          value={filters.neighborhood || ""}
          onChange={(e) => handleNeighborhoodChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        {/* Price dropdown */}
        <select
          value={currentPriceIndex === -1 ? "0" : String(currentPriceIndex)}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {PRICE_RANGES.map((range, i) => (
            <option key={i} value={String(i)}>
              {range.label}
            </option>
          ))}
        </select>

        {/* Bedrooms dropdown */}
        <select
          value={
            filters.bedrooms === null || filters.bedrooms === undefined
              ? "null"
              : String(filters.bedrooms)
          }
          onChange={(e) => handleBedroomChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {BEDROOM_OPTIONS.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* No Fee toggle */}
        <button
          onClick={handleNoFeeToggle}
          className={`
            inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              filters.noFeeOnly
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
            }
          `}
        >
          <span className={filters.noFeeOnly ? "" : "opacity-50"}>✓</span>
          <span>No Fee Only</span>
        </button>

        {/* More filters toggle (mobile) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <span>⚙️</span>
          <span>More</span>
          {activeFilterCount > 0 && (
            <span className="bg-indigo-100 text-indigo-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Clear all
          </button>
        )}

        {/* Results count */}
        {filteredCount !== undefined && totalCount !== undefined && (
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredCount} of {totalCount}
          </div>
        )}
      </div>

      {/* Expanded mobile filters */}
      {isExpanded && (
        <div className="lg:hidden mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            {/* Additional filters can go here */}
            <div className="col-span-2 text-sm text-gray-500">
              More filter options coming soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
