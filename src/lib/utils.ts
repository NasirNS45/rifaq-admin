import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPkr(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatCountLabel(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count.toLocaleString("en-PK")} ${word}`;
}
