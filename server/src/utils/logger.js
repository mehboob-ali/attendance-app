export const log = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
};

export const error = (...args) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR:`, ...args);
};
