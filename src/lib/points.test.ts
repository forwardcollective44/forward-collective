// Plain-Node assertions for the points engine. Run with `npm test` (tsx).
import assert from "node:assert";
import {
  calcOrderPoints,
  computeStreak,
  orderMultiplier,
  crossesEarlyAccess,
} from "./points";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const d = (s: string) => new Date(s);

// --- multipliers ---
test("multiplier tiers", () => {
  assert.equal(orderMultiplier(50), 1);
  assert.equal(orderMultiplier(100), 1.25);
  assert.equal(orderMultiplier(199.99), 1.25);
  assert.equal(orderMultiplier(200), 1.5);
});

// --- base + size bonus ---
test("base points + 1.25x bonus on a $120 order", () => {
  const r = calcOrderPoints({
    orderId: "o1",
    amount: 120,
    itemCount: 1,
    purchaseDate: d("2026-01-10"),
    purchaseCountBefore: 0,
    lastPurchaseDate: null,
    currentStreakMonths: 0,
  });
  // 120 base + round(120 * 0.25)=30
  assert.equal(r.totalEarned, 150);
  assert.equal(r.events.find((e) => e.type === "purchase_base")?.points, 120);
  assert.equal(r.events.find((e) => e.type === "order_size_bonus")?.points, 30);
});

// --- quantity bonus ---
test("3+ items adds +50", () => {
  const r = calcOrderPoints({
    orderId: "o2",
    amount: 60,
    itemCount: 3,
    purchaseDate: d("2026-01-10"),
    purchaseCountBefore: 0,
    lastPurchaseDate: null,
    currentStreakMonths: 0,
  });
  assert.equal(r.events.find((e) => e.type === "quantity_bonus")?.points, 50);
  assert.equal(r.totalEarned, 110); // 60 + 50
});

// --- recurring: 2nd within 60 days ---
test("2nd purchase within 60 days adds +75", () => {
  const r = calcOrderPoints({
    orderId: "o3",
    amount: 40,
    itemCount: 1,
    purchaseDate: d("2026-02-01"),
    purchaseCountBefore: 1,
    lastPurchaseDate: d("2026-01-05"),
    currentStreakMonths: 1,
  });
  assert.equal(r.events.find((e) => e.type === "recurring_bonus")?.points, 75);
});

test("2nd purchase past 60 days does NOT add the bonus", () => {
  const r = calcOrderPoints({
    orderId: "o4",
    amount: 40,
    itemCount: 1,
    purchaseDate: d("2026-04-01"),
    purchaseCountBefore: 1,
    lastPurchaseDate: d("2026-01-05"),
    currentStreakMonths: 1,
  });
  assert.equal(r.events.some((e) => e.type === "recurring_bonus"), false);
});

// --- streak ---
test("streak increments on a consecutive month", () => {
  assert.equal(computeStreak(2, d("2026-01-15"), d("2026-02-03")), 3);
});
test("streak resets after a skipped month", () => {
  assert.equal(computeStreak(5, d("2026-01-15"), d("2026-03-03")), 1);
});
test("same month does not advance streak", () => {
  assert.equal(computeStreak(4, d("2026-01-15"), d("2026-01-28")), 4);
});

test("reaching a 3-month streak fires +100", () => {
  const r = calcOrderPoints({
    orderId: "o5",
    amount: 30,
    itemCount: 1,
    purchaseDate: d("2026-03-02"),
    purchaseCountBefore: 5,
    lastPurchaseDate: d("2026-02-02"),
    currentStreakMonths: 2,
  });
  assert.equal(r.newStreakMonths, 3);
  assert.equal(r.events.find((e) => e.type === "streak_bonus")?.points, 100);
});

test("maintaining past 12 months fires +100", () => {
  const r = calcOrderPoints({
    orderId: "o6",
    amount: 30,
    itemCount: 1,
    purchaseDate: d("2026-03-02"),
    purchaseCountBefore: 20,
    lastPurchaseDate: d("2026-02-02"),
    currentStreakMonths: 13,
  });
  assert.equal(r.newStreakMonths, 14);
  assert.equal(r.events.find((e) => e.type === "streak_bonus")?.points, 100);
});

// --- early access threshold ---
test("crossing 6000 lifetime points flips early access", () => {
  assert.equal(crossesEarlyAccess(5900, 6010), true);
  assert.equal(crossesEarlyAccess(6010, 6200), false);
  assert.equal(crossesEarlyAccess(100, 200), false);
});

// --- stacked example ---
test("stacked: $220, 3 items, 3rd purchase ever, streak 3", () => {
  const r = calcOrderPoints({
    orderId: "o7",
    amount: 220,
    itemCount: 3,
    purchaseDate: d("2026-03-02"),
    purchaseCountBefore: 2,
    lastPurchaseDate: d("2026-02-02"),
    currentStreakMonths: 2,
  });
  // 220 base + 110 (1.5x extra) + 50 qty + 50 (3rd purchase) + 100 (3mo streak)
  assert.equal(r.totalEarned, 220 + 110 + 50 + 50 + 100);
});

console.log(`\n${passed} tests passed.`);
