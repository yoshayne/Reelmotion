const BLOCKED_TERMS = [
  "nigger", "nigga", "faggot", "chink", "spic", "kike",
  "retard", "cunt", "whore", "slut", "tranny",
  // add more as needed
];

export function containsBlockedContent(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_TERMS.some(term => lower.includes(term));
}
