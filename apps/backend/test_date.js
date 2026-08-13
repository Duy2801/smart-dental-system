const date = new Date('2026-08-13T00:00:00');
date.setHours(8, 0, 0, 0);
const now = new Date();
console.log('date', date.toISOString(), date.toLocaleString());
console.log('now', now.toISOString(), now.toLocaleString());
console.log('date <= now', date <= now);
