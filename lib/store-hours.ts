export interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface BusinessHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export type DayKey = keyof BusinessHours;
export const MARKET_TIME_ZONE = "Africa/Lagos";

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { open: true, openTime: "09:00", closeTime: "20:00" },
  tuesday: { open: true, openTime: "09:00", closeTime: "20:00" },
  wednesday: { open: true, openTime: "09:00", closeTime: "20:00" },
  thursday: { open: true, openTime: "09:00", closeTime: "20:00" },
  friday: { open: true, openTime: "09:00", closeTime: "20:00" },
  saturday: { open: true, openTime: "09:00", closeTime: "20:00" },
  sunday: { open: false, openTime: "09:00", closeTime: "20:00" },
};

export const DAY_KEYS: DayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

const DAY_LABELS: Record<DayKey, string> = {
  sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed",
  thursday: "Thu", friday: "Fri", saturday: "Sat",
};

export interface StoreStatus {
  isOpen: boolean;
  label: "Open" | "Closed";
  detail: string;
}

export function isValidDaySchedule(schedule: unknown): schedule is DaySchedule {
  if (!schedule || typeof schedule !== "object") return false;
  const value = schedule as Partial<DaySchedule>;
  const validTime = (time: unknown) =>
    typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
  return typeof value.open === "boolean" && validTime(value.openTime) && validTime(value.closeTime);
}

export function resolveBusinessHours(
  businessHours?: Partial<BusinessHours> | null,
): BusinessHours {
  const resolved = {} as BusinessHours;
  for (const day of DAY_KEYS) {
    const schedule = businessHours?.[day];
    resolved[day] = isValidDaySchedule(schedule) ? schedule : DEFAULT_BUSINESS_HOURS[day];
  }
  return resolved;
}

export function formatDisplayTime(time: string): string {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function parseMinutes(time: string): number {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getZonedTime(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const todayKey = values.weekday.toLowerCase() as DayKey;
  return {
    todayKey,
    todayIndex: DAY_KEYS.indexOf(todayKey),
    currentMinutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

export function getTodayKey(date = new Date(), timeZone = MARKET_TIME_ZONE): DayKey {
  return getZonedTime(date, timeZone).todayKey;
}

export function getStoreStatus(
  businessHours?: Partial<BusinessHours> | null,
  date = new Date(),
  timeZone = MARKET_TIME_ZONE,
): StoreStatus {
  const hours = resolveBusinessHours(businessHours);
  const { todayKey, todayIndex, currentMinutes } = getZonedTime(date, timeZone);
  const today = hours[todayKey];
  const previous = hours[DAY_KEYS[(todayIndex + 6) % 7]];
  const previousOpen = parseMinutes(previous.openTime);
  const previousClose = parseMinutes(previous.closeTime);

  if (previous.open && previousClose <= previousOpen && currentMinutes < previousClose) {
    return { isOpen: true, label: "Open", detail: `Closes ${formatDisplayTime(previous.closeTime)}` };
  }

  if (today.open) {
    const openMinutes = parseMinutes(today.openTime);
    const closeMinutes = parseMinutes(today.closeTime);
    const isOpenNow = closeMinutes <= openMinutes
      ? currentMinutes >= openMinutes
      : currentMinutes >= openMinutes && currentMinutes < closeMinutes;

    if (isOpenNow) {
      return { isOpen: true, label: "Open", detail: `Closes ${formatDisplayTime(today.closeTime)}` };
    }
    if (currentMinutes < openMinutes) {
      return { isOpen: false, label: "Closed", detail: `Opens today ${formatDisplayTime(today.openTime)}` };
    }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const nextKey = DAY_KEYS[(todayIndex + offset) % 7];
    const next = hours[nextKey];
    if (next.open) {
      const day = offset === 1 ? "tomorrow" : DAY_LABELS[nextKey];
      return { isOpen: false, label: "Closed", detail: `Opens ${day} ${formatDisplayTime(next.openTime)}` };
    }
  }

  return { isOpen: false, label: "Closed", detail: "No opening hours" };
}
