
console.group("Sum of Odds");
builder(`
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
console.groupEnd("Sum of Odds");


console.groupCollapsed("Counter and Sum");
builder(`
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
console.groupEnd("Counter and Sum");


console.groupCollapsed("Loop");
builder(`
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
console.groupEnd("Loop");

