// Unit test: BUCKET_RANGE overlap logic — no CSV, no imports needed
const BUCKET_RANGE: Record<string, [number, number]> = {
  "<1":  [0, 1],
  "1-3": [1, 3],
  "3-8": [3, 8],
  "8-10":[8, 10],
  ">10": [10, 99],
};

function shouldPass(bucket: string, min: number, max: number): boolean {
  const range = BUCKET_RANGE[bucket];
  if (!range) return true; // unknown = no data, pass through
  const [bMin, bMax] = range;
  if (min > 0 && bMax <= min) return false;  // bucket entirely below floor
  if (max > 0 && bMin >= max) return false;  // bucket at or above cap
  return true;
}

const cases: [string, number, number, boolean, string][] = [
  // [bucket, min, max, expected, label]
  ["<1",   3, 5, false, "3-5yr: freshers out"],
  ["1-3",  3, 5, false, "3-5yr: 1-3yr out  (bMax 3 <= min 3)"],
  ["3-8",  3, 5, true,  "3-5yr: 3-8yr IN   (target bucket)"],
  ["8-10", 3, 5, false, "3-5yr: 8-10yr out (bMin 8 >= max 5)"],
  [">10",  3, 5, false, "3-5yr: >10yr out"],

  ["<1",   0, 1, true,  "0-1yr: freshers IN"],
  ["1-3",  0, 1, false, "0-1yr: 1-3yr out  (bMin 1 >= max 1)"],
  ["3-8",  0, 1, false, "0-1yr: 3-8yr out"],
  ["8-10", 0, 1, false, "0-1yr: 8-10yr out"],
  [">10",  0, 1, false, "0-1yr: >10yr out"],

  ["<1",   0, 2, true,  "0-2yr: freshers IN"],
  ["1-3",  0, 2, true,  "0-2yr: 1-3yr IN   (1-2yr candidates sit here)"],
  ["3-8",  0, 2, false, "0-2yr: 3-8yr out  (bMin 3 >= max 2)"],
  ["8-10", 0, 2, false, "0-2yr: 8-10yr out"],

  ["<1",   8, 0, false, "8+yr:  freshers out"],
  ["1-3",  8, 0, false, "8+yr:  1-3yr out"],
  ["3-8",  8, 0, false, "8+yr:  3-8yr out  (bMax 8 <= min 8)"],
  ["8-10", 8, 0, true,  "8+yr:  8-10yr IN"],
  [">10",  8, 0, true,  "8+yr:  >10yr IN   (no cap)"],
];

let pass = 0, fail = 0;
for (const [bucket, min, max, expected, label] of cases) {
  const result = shouldPass(bucket, min, max);
  const ok = result === expected;
  if (ok) pass++; else fail++;
  console.log(ok ? "[OK]  " : "[FAIL]", label, "->", result);
}

console.log("");
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
