import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number | string,
  options: {
    notation?: Intl.NumberFormatOptions["notation"];
  } = {}
) {
  const { notation = "compact" } = options;

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN", // Nigerian Naira
    notation,
  }).format(Number(price));
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getInitials(name: string) {
  const parts = name.split(" ");
  let initials = "";

  if (parts.length === 1) {
    initials = parts[0].substring(0, 2);
  } else {
    parts.forEach((part) => {
      if (part.length > 0) {
        initials += part[0];
      }
    });
  }

  return initials.toUpperCase().substring(0, 2);
}
