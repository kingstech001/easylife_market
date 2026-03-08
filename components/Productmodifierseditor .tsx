"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  UtensilsCrossed,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror the Mongoose interfaces)
// ─────────────────────────────────────────────────────────────────────────────

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

interface ProductModifiersEditorProps {
  modifierGroups: ModifierGroup[];
  onChange: (groups: ModifierGroup[]) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function newOption(): ModifierOption {
  return { name: "", priceAdjustment: 0, isActive: true };
}

function newGroup(): ModifierGroup {
  return {
    name: "",
    required: false,
    selectionType: "single",
    minSelection: 0,
    maxSelection: 1,
    options: [newOption()],
  };
}

function groupIsValid(g: ModifierGroup): boolean {
  if (!g.name.trim()) return false;
  if (g.options.length === 0) return false;
  if (g.options.some((o) => !o.name.trim())) return false;
  if (g.minSelection > g.maxSelection) return false;
  if (g.selectionType === "single" && g.maxSelection !== 1) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductModifiersEditor({
  modifierGroups,
  onChange,
}: ProductModifiersEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    modifierGroups.length === 0 ? null : 0
  );

  // ── Group-level mutations ──────────────────────────────────────────────────

  const addGroup = () => {
    const updated = [...modifierGroups, newGroup()];
    onChange(updated);
    setExpandedIndex(updated.length - 1);
  };

  const removeGroup = (gi: number) => {
    const updated = modifierGroups.filter((_, i) => i !== gi);
    onChange(updated);
    if (expandedIndex === gi) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > gi)
      setExpandedIndex(expandedIndex - 1);
  };

  const updateGroup = (gi: number, patch: Partial<ModifierGroup>) => {
    const updated = modifierGroups.map((g, i) => {
      if (i !== gi) return g;
      const next = { ...g, ...patch };

      // Auto-enforce: single → maxSelection must be 1
      if (patch.selectionType === "single") {
        next.maxSelection = 1;
        if (next.required) next.minSelection = 1;
        else next.minSelection = Math.min(next.minSelection, 1);
      }

      // Auto-enforce: required + single → min = 1
      if (patch.required && next.selectionType === "single") {
        next.minSelection = 1;
      }
      if (patch.required === false && next.selectionType === "single") {
        next.minSelection = 0;
      }

      // Keep min ≤ max
      if (
        patch.minSelection !== undefined &&
        next.minSelection > next.maxSelection
      ) {
        next.maxSelection = next.minSelection;
      }
      if (
        patch.maxSelection !== undefined &&
        next.maxSelection < next.minSelection
      ) {
        next.minSelection = next.maxSelection;
      }

      return next;
    });
    onChange(updated);
  };

  // ── Option-level mutations ─────────────────────────────────────────────────

  const addOption = (gi: number) => {
    const updated = modifierGroups.map((g, i) =>
      i === gi ? { ...g, options: [...g.options, newOption()] } : g
    );
    onChange(updated);
  };

  const removeOption = (gi: number, oi: number) => {
    const updated = modifierGroups.map((g, i) =>
      i === gi
        ? { ...g, options: g.options.filter((_, j) => j !== oi) }
        : g
    );
    onChange(updated);
  };

  const updateOption = (
    gi: number,
    oi: number,
    patch: Partial<ModifierOption>
  ) => {
    const updated = modifierGroups.map((g, i) =>
      i === gi
        ? {
            ...g,
            options: g.options.map((o, j) =>
              j === oi ? { ...o, ...patch } : o
            ),
          }
        : g
    );
    onChange(updated);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Empty state */}
      {modifierGroups.length === 0 && (
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-10 text-center bg-muted/10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-orange-400" />
          </div>
          <h3 className="text-base font-semibold mb-1">No modifier groups yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
            Add groups like "Choose your soup", "Extra protein", "Drink
            options" — each with their own options and rules.
          </p>
          <Button type="button" variant="outline" onClick={addGroup} className="gap-2">
            <Plus className="w-4 h-4" /> Add First Group
          </Button>
        </div>
      )}

      {/* Group list */}
      <AnimatePresence initial={false}>
        {modifierGroups.map((group, gi) => {
          const isOpen = expandedIndex === gi;
          const valid = groupIsValid(group);

          return (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "rounded-2xl border transition-all duration-200",
                isOpen
                  ? "border-orange-300 dark:border-orange-700 shadow-md shadow-orange-100 dark:shadow-orange-950/30"
                  : "border-border hover:border-orange-200 dark:hover:border-orange-800"
              )}
            >
              {/* ── Group header ── */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer select-none rounded-2xl transition-colors",
                  isOpen ? "bg-orange-50/60 dark:bg-orange-950/20" : "bg-card"
                )}
                onClick={() => setExpandedIndex(isOpen ? null : gi)}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />

                <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm truncate">
                    {group.name || (
                      <span className="text-muted-foreground font-normal italic">
                        Untitled group
                      </span>
                    )}
                  </span>

                  {/* Summary badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {group.required ? (
                      <Badge className="text-[10px] h-4 px-1.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0">
                        Required
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5"
                      >
                        Optional
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
                    >
                      {group.selectionType === "single"
                        ? "Pick 1"
                        : `Pick ${group.minSelection}–${group.maxSelection}`}
                    </Badge>
                    {group.options.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {group.options.length} option
                        {group.options.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>

                  {/* Validation indicator */}
                  {valid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGroup(gi);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* ── Group body ── */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-5 border-t border-border/50">

                      {/* Group name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Group Name
                        </Label>
                        <Input
                          placeholder='e.g. "Choose your soup", "Add-ons", "Drink"'
                          value={group.name}
                          onChange={(e) =>
                            updateGroup(gi, { name: e.target.value })
                          }
                          className="h-10 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>

                      {/* Rules row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* Required toggle */}
                        <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:flex-col sm:items-start gap-2 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Required?
                          </Label>
                          <Switch
                            checked={group.required}
                            onCheckedChange={(v) =>
                              updateGroup(gi, { required: v })
                            }
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </div>

                        {/* Selection type */}
                        <div className="col-span-2 sm:col-span-1 space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Selection
                          </Label>
                          <Select
                            value={group.selectionType}
                            onValueChange={(v: "single" | "multiple") =>
                              updateGroup(gi, { selectionType: v })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs border-0 bg-transparent p-0 focus:ring-0 shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single" className="text-xs">
                                Single (pick 1)
                              </SelectItem>
                              <SelectItem value="multiple" className="text-xs">
                                Multiple (pick many)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Min */}
                        <div className="space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Min picks
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={group.maxSelection}
                            value={group.minSelection}
                            disabled={group.selectionType === "single"}
                            onChange={(e) =>
                              updateGroup(gi, {
                                minSelection: Math.max(
                                  0,
                                  Number(e.target.value)
                                ),
                              })
                            }
                            className="h-8 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        {/* Max */}
                        <div className="space-y-1.5 rounded-xl border border-border/60 px-3 py-2.5 bg-muted/20">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Max picks
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={group.maxSelection}
                            disabled={group.selectionType === "single"}
                            onChange={(e) =>
                              updateGroup(gi, {
                                maxSelection: Math.max(
                                  1,
                                  Number(e.target.value)
                                ),
                              })
                            }
                            className="h-8 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                      </div>

                      {/* Auto-hint */}
                      {group.selectionType === "single" && (
                        <p className="text-[11px] text-muted-foreground -mt-2">
                          Single selection locks max to 1. Switch to{" "}
                          <strong>Multiple</strong> to allow 2+ picks.
                        </p>
                      )}

                      {/* Options */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Options
                        </Label>

                        <div className="space-y-2">
                          <AnimatePresence initial={false}>
                            {group.options.map((opt, oi) => (
                              <motion.div
                                key={oi}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2"
                              >
                                {/* Active toggle */}
                                <button
                                  type="button"
                                  title={
                                    opt.isActive
                                      ? "Mark unavailable"
                                      : "Mark available"
                                  }
                                  onClick={() =>
                                    updateOption(gi, oi, {
                                      isActive: !opt.isActive,
                                    })
                                  }
                                  className="flex-shrink-0"
                                >
                                  {opt.isActive ? (
                                    <ToggleRight className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-muted-foreground/40" />
                                  )}
                                </button>

                                {/* Name */}
                                <Input
                                  placeholder="Option name (e.g. Ofe Onugbu)"
                                  value={opt.name}
                                  onChange={(e) =>
                                    updateOption(gi, oi, {
                                      name: e.target.value,
                                    })
                                  }
                                  className={cn(
                                    "flex-1 h-9 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors",
                                    !opt.isActive &&
                                      "opacity-50 line-through"
                                  )}
                                />

                                {/* Price adjustment */}
                                <div className="relative w-24 flex-shrink-0">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                                    ₦
                                  </span>
                                  <Input
                                    type="number"
                                    step="50"
                                    title="Extra charge (0 = no extra charge)"
                                    placeholder="0"
                                    value={
                                      opt.priceAdjustment === 0
                                        ? ""
                                        : opt.priceAdjustment
                                    }
                                    onChange={(e) =>
                                      updateOption(gi, oi, {
                                        priceAdjustment: Number(
                                          e.target.value
                                        ),
                                      })
                                    }
                                    className="pl-6 h-9 text-sm focus:border-orange-400 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </div>

                                {/* Remove option */}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={group.options.length === 1}
                                  onClick={() => removeOption(gi, oi)}
                                  className="h-9 w-9 p-0 flex-shrink-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(gi)}
                          className="w-full h-8 border-dashed border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-300 text-xs gap-1.5 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Option
                        </Button>
                      </div>

                      {/* Validation hint */}
                      {!valid && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 px-3 py-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {!group.name.trim()
                              ? "Give this group a name."
                              : group.options.some((o) => !o.name.trim())
                              ? "All options need a name."
                              : "Check your min/max settings."}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Add group button (shown when groups exist) */}
      {modifierGroups.length > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={addGroup}
          className="w-full h-10 border-dashed border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-400 gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Another Group
        </Button>
      )}
    </div>
  );
}