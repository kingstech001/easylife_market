"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChefHat, ChevronDown, Plus, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ModifierOption {
  _id?: string;
  name: string;
  priceAdjustment: number;
  inventoryQuantity?: number;
  isActive: boolean;
}

export interface ModifierGroup {
  _id?: string;
  name: string;
  required: boolean;
  selectionType: "single" | "multiple";
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

interface ModifierSectionProps {
  groups: ModifierGroup[];
  selections: Record<string, string[]>;
  onToggle: (
    groupId: string,
    optionId: string,
    selectionType: "single" | "multiple",
    maxSelection: number
  ) => void;
  formatAmount: (amount: number) => string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function ModifierSection({
  groups,
  selections,
  onToggle,
  formatAmount,
}: ModifierSectionProps) {
  const activeGroups = groups.filter((g) => g.options.some((o) => o.isActive));

  // Outer section collapse state
  const [sectionOpen, setSectionOpen] = useState(true);

  // Inner group collapse states — all open by default
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(activeGroups.map((g) => [g._id || g.name, true]))
  );

  if (activeGroups.length === 0) return null;

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // Total selected count across all groups (for the collapsed summary)
  const totalSelected = Object.values(selections).flat().length;

  return (
    <div className="rounded-2xl border-2 overflow-hidden">

      {/* ── Outer header — collapses the whole section ── */}
      <button
        onClick={() => setSectionOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:brightness-95 transition-all text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <ChefHat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Customize Your Order</p>
            <p className="text-[11px] text-muted-foreground">
              {sectionOpen
                ? "Select your preferred options"
                : totalSelected > 0
                ? `${totalSelected} option${totalSelected > 1 ? "s" : ""} selected`
                : "Tap to customize"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Count badge — shown when collapsed and has selections */}
          {!sectionOpen && totalSelected > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#e1a200] text-white text-[10px] font-bold flex items-center justify-center">
              {totalSelected}
            </span>
          )}
          <motion.div
            animate={{ rotate: sectionOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* ── Collapsible body ── */}
      <AnimatePresence initial={false}>
        {sectionOpen && (
          <motion.div
            key="section-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="divide-y border-t">
              {activeGroups.map((group, groupIdx) => {
                const groupKey = group._id || group.name;
                const selectedIds = selections[groupKey] || [];
                const activeOptions = group.options.filter((o) => o.isActive);
                const selectionCount = selectedIds.length;
                const isOpen = openGroups[groupKey] ?? true;
                const isSatisfied =
                  !group.required ||
                  (selectionCount >= group.minSelection &&
                    selectionCount <= group.maxSelection);

                return (
                  <div key={groupKey}>

                    {/* ── Group accordion trigger ── */}
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="w-full flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">{group.name}</span>

                        {group.required && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 flex-shrink-0"
                          >
                            Required
                          </Badge>
                        )}

                        {/* Count bubble when this group is collapsed */}
                        {!isOpen && selectionCount > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#e1a200] text-white text-[10px] font-bold flex items-center justify-center">
                            {selectionCount}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {group.selectionType === "multiple" && (
                          <span className="text-[11px] text-muted-foreground hidden sm:block">
                            {group.minSelection === group.maxSelection
                              ? `Pick ${group.minSelection}`
                              : group.maxSelection > 1
                              ? `Up to ${group.maxSelection}`
                              : "Pick any"}
                          </span>
                        )}

                        {/* Required satisfied dot */}
                        {group.required && (
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                              isSatisfied ? "bg-green-500" : "bg-muted-foreground/20"
                            }`}
                          >
                            {isSatisfied && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </span>
                        )}

                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </motion.div>
                      </div>
                    </button>

                    {/* ── Options list ── */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="group-options"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="bg-muted/20">
                            {activeOptions.map((option, optIdx) => {
                              const optionKey = option._id || option.name;
                              const isSelected = selectedIds.includes(optionKey);
                              const isFree = option.priceAdjustment === 0;
                              const isLast = optIdx === activeOptions.length - 1;

                              return (
                                <div
                                  key={optionKey}
                                  className={`flex items-center justify-between px-4 sm:px-5 py-3 transition-colors ${
                                    !isLast ? "border-b border-border/50" : ""
                                  } ${isSelected ? "bg-[#e1a200]/5" : ""}`}
                                >
                                  {/* Name + price */}
                                  <div className="flex-1 min-w-0 pr-4">
                                    <p
                                      className={`text-sm font-medium leading-snug ${
                                        isSelected ? "text-[#c48f00]" : ""
                                      }`}
                                    >
                                      {option.name}
                                    </p>
                                    <p
                                      className={`text-[10px] mt-0.5 font-semibold ${
                                        isFree
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-[#e1a200]"
                                      }`}
                                    >
                                      {isFree
                                        ? "Free"
                                        : option.priceAdjustment > 0
                                        ? `+${formatAmount(option.priceAdjustment)}`
                                        : formatAmount(option.priceAdjustment)}
                                    </p>
                                  </div>

                                  {/* +/- button */}
                                  <motion.button
                                    whileTap={{ scale: 0.88 }}
                                    onClick={() =>
                                      onToggle(
                                        groupKey,
                                        optionKey,
                                        group.selectionType,
                                        group.maxSelection
                                      )
                                    }
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                      isSelected
                                        ? "bg-[#e0ac29] border-[#e0ac29] text-white"
                                        : "border-border hover:border-[#e1a200] hover:text-[#e1a200] text-muted-foreground"
                                    }`}
                                    aria-label={
                                      isSelected
                                        ? `Remove ${option.name}`
                                        : `Add ${option.name}`
                                    }
                                  >
                                    <AnimatePresence mode="wait" initial={false}>
                                      {isSelected ? (
                                        <motion.span
                                          key="minus"
                                          initial={{ opacity: 0, rotate: -90 }}
                                          animate={{ opacity: 1, rotate: 0 }}
                                          exit={{ opacity: 0, rotate: 90 }}
                                          transition={{ duration: 0.15 }}
                                        >
                                          <Minus className="h-3.5 w-3.5" />
                                        </motion.span>
                                      ) : (
                                        <motion.span
                                          key="plus"
                                          initial={{ opacity: 0, rotate: 90 }}
                                          animate={{ opacity: 1, rotate: 0 }}
                                          exit={{ opacity: 0, rotate: -90 }}
                                          transition={{ duration: 0.15 }}
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.button>
                                </div>
                              );
                            })}

                            {/* Selection count footer for multiple */}
                            {group.selectionType === "multiple" && selectionCount > 0 && (
                              <div className="px-4 sm:px-5 py-2 border-t border-border/50">
                                <p className="text-[11px] text-muted-foreground">
                                  {selectionCount} selected
                                  {group.maxSelection > 1 &&
                                    ` / ${group.maxSelection} max`}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}