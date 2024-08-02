import { expect, test } from "vitest";
import { builder } from "../src/analysis";

test("Sum of Odds", () => {
  const code = builder(`
    // 定义一个函数 so1，返回一个对象，其中包含属性 so
    function so1() {
      return { so: "someValue" };
    }
    
    // 定义一个函数 main，用于查找特定条件下的值
    function main() {
      for (let index = 0; index < 10; index++) {
        if (index === 5) {
          return index; // 返回 5
        }
      }
      return null; // 如果没有找到，返回 null
    }
    
    // 使用 so1 函数，并解构赋值获取 so 属性
    let { so } = so1();
    
    // 调用 main 函数并获取结果
    let result = main();
    
    // 使用解构赋值从空数组中获取属性（不会有任何效果）
    const { aa1, bb2 } = [];
    
    // 假设 xx 函数返回一个对象，我们从中解构赋值获取属性
    function xx() {
      return { aa3: "value3", aa4: "value4" };
    }
    const { aa3, aa4 } = xx();
    
    // 输出结果
    console.log(so);
    console.log(result);
    console.log(aa3, aa4);
    `);
  expect(code).toMatchSnapshot();
});
