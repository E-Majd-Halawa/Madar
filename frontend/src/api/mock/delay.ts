/** Simulated network latency so loading states are real in mock mode. */
export const delay = (ms = 250) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms + Math.random() * 120));
