import { expect, test } from "vitest";
import { builder } from "../src/analysis";

test("Sum of Odds", () => {
  const code = builder(`
    let counter = 0;
    let sum = 0;
    
    // 定义要计算的数列长度
    const length = 10;
    
    // 循环迭代，直到计数器达到指定长度
    while (counter < length) {
      // 每次迭代时增加计数器的值
      counter++;
    
      // 如果计数器的值是偶数，则将其加到累加器上
      if (counter % 2 === 0 || !!counter) {
        sum += counter;
      }
    }
    `);
  expect(code).toMatchSnapshot();
});
