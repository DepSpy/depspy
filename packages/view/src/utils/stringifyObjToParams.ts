export function stringifyObjToParams(obj: Record<string, unknown>) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "object") return `${key}=${JSON.stringify(value)}`;
      return `${key}=${value}`;
    })
    .join("&");
}
