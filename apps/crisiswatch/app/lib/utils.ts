import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lerp(start: number, end: number, factor: number) {
  return start + (end - start) * factor;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
