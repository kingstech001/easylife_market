// components/business-hours-editor.tsx
"use client";

import { toast } from "sonner";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

export const DAYS = [
  { key: "monday",    label: "Mon", full: "Monday"    },
  { key: "tuesday",   label: "Tue", full: "Tuesday"   },
  { key: "wednesday", label: "Wed", full: "Wednesday" },
  { key: "thursday",  label: "Thu", full: "Thursday"  },
  { key: "friday",    label: "Fri", full: "Friday"    },
  { key: "saturday",  label: "Sat", full: "Saturday"  },
  { key: "sunday",    label: "Sun", full: "Sunday"    },
] as const;

export type DayKey = (typeof DAYS)[number]["key"];

export type DaySchedule = {
  open: boolean;
  openTime: string;
  closeTime: string;
};

export type BusinessHours = Record<DayKey, DaySchedule>;

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday:    { open: true,  openTime: "09:00", closeTime: "18:00" },
  tuesday:   { open: true,  openTime: "09:00", closeTime: "18:00" },
  wednesday: { open: true,  openTime: "09:00", closeTime: "18:00" },
  thursday:  { open: true,  openTime: "09:00", closeTime: "18:00" },
  friday:    { open: true,  openTime: "09:00", closeTime: "18:00" },
  saturday:  { open: true,  openTime: "10:00", closeTime: "16:00" },
  sunday:    { open: false, openTime: "10:00", closeTime: "16:00" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Time options helper — every 30 minutes, 12-hour format
// ─────────────────────────────────────────────────────────────────────────────

function buildTimeOptions(): { value: string; label: string }[] {
  const times: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const value  = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm   = h < 12 ? "AM" : "PM";
      times.push({ value, label: `${hour12}:${String(m).padStart(2, "0")} ${ampm}` });
    }
  }
  return times;
}

const TIME_OPTIONS = buildTimeOptions();

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface BusinessHoursEditorProps {
  value: BusinessHours;
  onChange: (hours: BusinessHours) => void;
  /** Optionally hide the section heading */
  showHeading?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function BusinessHoursEditor({
  value,
  onChange,
  showHeading = true,
}: BusinessHoursEditorProps) {
  const toggle = (day: DayKey) =>
    onChange({ ...value, [day]: { ...value[day], open: !value[day].open } });

  const update = (day: DayKey, field: "openTime" | "closeTime", time: string) =>
    onChange({ ...value, [day]: { ...value[day], [field]: time } });

  const applyWeekdays = () => {
    const ref     = value.monday;
    const updated = { ...value };
    (["monday", "tuesday", "wednesday", "thursday", "friday"] as DayKey[]).forEach((d) => {
      updated[d] = { ...updated[d], openTime: ref.openTime, closeTime: ref.closeTime };
    });
    onChange(updated);
    toast.success("Monday hours applied to all weekdays");
  };

  return (
    <div className="space-y-3">
      {showHeading && (
        <div className="flex items-center gap-2.5 mb-1">
          <div className="h-8 w-8 rounded-lg bg-[#c0a146]/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-[#c0a146]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Business Hours</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set your opening &amp; closing times per day
            </p>
          </div>
        </div>
      )}

      {/* Day rows */}
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = value[key];
          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border transition-all duration-200 overflow-hidden",
                day.open
                  ? "border-border/60 bg-card"
                  : "border-border/30 bg-muted/10"
              )}
            >
              <div className="flex items-center gap-3 px-3 py-2.5">
                {/* Toggle switch */}
                <button
                  type="button"
                  aria-label={`Toggle ${key}`}
                  onClick={() => toggle(key)}
                  className={cn(
                    "relative w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200",
                    day.open ? "bg-[#c0a146]" : "bg-muted-foreground/25"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                      day.open ? "translate-x-[-16px]" : "translate-x-0"
                    )}
                  />
                </button>

                {/* Day label */}
                <span
                  className={cn(
                    "text-sm font-semibold w-8 flex-shrink-0 select-none",
                    day.open ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>

                {day.open ? (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <select
                      value={day.openTime}
                      onChange={(e) => update(key, "openTime", e.target.value)}
                      className="flex-1 min-w-0 h-8 rounded-lg border border-border/50 bg-background text-xs px-2 focus:border-[#c0a146] focus:outline-none transition-colors cursor-pointer"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    <span className="text-xs text-muted-foreground flex-shrink-0">–</span>

                    <select
                      value={day.closeTime}
                      onChange={(e) => update(key, "closeTime", e.target.value)}
                      className="flex-1 min-w-0 h-8 rounded-lg border border-border/50 bg-background text-xs px-2 focus:border-[#c0a146] focus:outline-none transition-colors cursor-pointer"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="flex-1 text-xs text-muted-foreground italic">
                    Closed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick-fill shortcut */}
      <button
        type="button"
        onClick={applyWeekdays}
        className="w-full text-xs text-[#c0a146] hover:text-[#d4b55e] underline underline-offset-2 transition-colors pt-1 pb-0.5"
      >
        Copy Monday hours to all weekdays (Mon – Fri)
      </button>
    </div>
  );
}