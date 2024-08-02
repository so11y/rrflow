import { expect, test } from "vitest";
import { builder } from "../src/analysis";

test("Sum of Odds", () => {
  const code = builder(`
    function sumOfOdds(n) {
      let sum = 0;
      for (let i = 1; i <= n; i++) {
        if (i % 2 !== 0) {
          sum += i;
        }
      }
      return sum;
    }
    console.log(sumOfOdds(10)); // 输出 25
    `);

  expect(code).toMatchSnapshot();
});
