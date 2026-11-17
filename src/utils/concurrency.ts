/**
 * Maps `items` through an async `task` with at most `limit` tasks in flight,
 * returning results in input order. The first rejection rejects the whole
 * call; tasks already started run on, but no new ones are started.
 */
export async function mapWithConcurrency<Item, Result>(
  items: readonly Item[],
  limit: number,
  task: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let next = 0;
  let failed = false;

  async function worker(): Promise<void> {
    while (!failed && next < items.length) {
      const index = next;
      next += 1;
      try {
        results[index] = await task(items[index]);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}
