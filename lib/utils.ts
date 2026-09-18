import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR") {
  const currencyLocales: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "en-IE",
    GBP: "en-GB",
    AED: "en-AE",
    SGD: "en-SG",
    AUD: "en-AU",
    CAD: "en-CA",
  };
  const locale = currencyLocales[currency?.toUpperCase()] || "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date | null | undefined) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(timeString: string | null | undefined) {
  if (!timeString) return "N/A";
  const [hours, minutes] = timeString.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
}

export function formatTimeAgo(dateString: string | Date | null | undefined): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return formatDate(date);
}
