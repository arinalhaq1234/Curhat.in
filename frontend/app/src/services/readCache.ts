// Cache memori per sesi; tidak disimpan ke disk dan tidak pernah dicatat ke log.
const snapshots = new Map<string, any>();
const pending = new Map<string, Promise<any>>();
let generation = 0;
const key = (token: string, path: string) => JSON.stringify([token, path]);

export function cachedRead(token: string, path: string) {
  return snapshots.get(key(token, path));
}
export function clearReadCache() {
  generation++;
  snapshots.clear();
  pending.clear();
}
export function readOnce(token: string, path: string, request: () => Promise<any>) {
  const cacheKey = key(token, path);
  const existing = pending.get(cacheKey);
  if (existing) return existing;
  const version = generation;
  const promise = request().then(response => {
    if (generation === version && response?.success === true) snapshots.set(cacheKey, response);
    return response;
  }).finally(() => {
    if (pending.get(cacheKey) === promise) pending.delete(cacheKey);
  });
  pending.set(cacheKey, promise);
  return promise;
}
