import { addDays, setHours, startOfDay } from 'date-fns';

/** ISO timestamp for `offset` days from today at `hour` local time. Seed data uses this so demo dates never go stale. */
export const dayOffsetIso = (offset: number, hour = 17): string =>
  setHours(addDays(startOfDay(new Date()), offset), hour).toISOString();

export const hoursAgoIso = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();
