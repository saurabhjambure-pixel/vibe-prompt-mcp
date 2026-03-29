import { get_encoding } from "tiktoken";

const enc = get_encoding("cl100k_base");

export function countTokens(text: string): number {
  return enc.encode(text).length;
}

export function estimateCostSaved(tokensSaved: number): number {
  return parseFloat(((tokensSaved / 1_000_000) * 2).toFixed(6));
}
