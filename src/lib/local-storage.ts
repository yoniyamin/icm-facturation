export function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_STORAGE_MODE === "local";
}
