import destructuring from "@babel/plugin-transform-destructuring";
import { transform, packages } from "@babel/standalone";

function getRefNodeName(path) {
  const { types } = packages;
  switch (path.type) {
    case "Identifier":
      return path.node.name;
    case "MemberExpression": {
      let node = path.node;
      while (!types.isIdentifier(node)) {
        node = node.object;
      }
      return node.name;
    }
  }
  throw `不支持`;
}

function isInTestBinary(path) {
  const { types } = packages;
  const parentValidate = [
    types.isForStatement,
    types.isWhileStatement,
    types.isIfStatement,
  ];
  return parentValidate.some((validate) => validate(path.parent));
}

function isLoopStatement(path) {
  const { types } = packages;
  const validates = [types.isForStatement, types.isWhileStatement];
  return validates.some((validate) => validate(path));
}

function builder(code) {
  const { types, template, generator } = packages;
  const transformed = transform(code, {
    plugins: [
      destructuring,
      {
        visitor: {
          Program(path, state) {
            state.scopeTrack = path.scope.generateUidIdentifier("scopeTrack");
            state.scopeHelper = path.scope.generateUidIdentifier("scopeHelper");
          },
          VariableDeclaration: {
            exit(path, state) {
              path.get("declarations").forEach((decPath) => {
                const tempCode = template.default`SCOPE_HELPER.variable(NAME,CODE)`;
                const newCode = tempCode({
                  NAME: types.StringLiteral(decPath.get("id.name").node),
                  CODE: decPath.get("init").node,
                  SCOPE_HELPER: state.scopeHelper,
                }).expression;
                decPath.set("init", newCode);
              });
              path.skip();
            },
          },
          CallExpression: {
            exit(path, state) {
              const tempCode = template.default`SCOPE_HELPER.execute(()=> FN)`;
              path.replaceWith(
                tempCode({
                  FN: path.node,
                  SCOPE_HELPER: state.scopeHelper,
                }).expression
              );
              path.skip();
            },
          },
          ReturnStatement: {
            exit(path, state) {
              const tempCode = template.default`
              return SCOPE_TRACK.drop(NODE)
              `;
              path.replaceWith(
                tempCode({
                  SCOPE_TRACK: state.scopeTrack,
                  NODE: path.get("argument").node,
                })
              );
              path.skip();
            },
          },
          BreakStatement: {
            exit(path, state) {
              const nodes = [
                template.default.ast(`${state.scopeTrack.name}.drop()`),
                path.node,
              ];
              const newPath = path.replaceWithMultiple(nodes);
              newPath.forEach((path) => path.skip());
            },
          },
          "ForStatement|WhileStatement|IfStatement": {
            enter(_, state) {
              if (state.forIndex === undefined) {
                state.forIndex = 0;
              } else {
                state.forIndex++;
              }
            },
            exit(path, state) {
              const scopeName = isLoopStatement(path) ? "for" : "if";
              const tempCode = template.default(
                `{
                /****** ${state.forIndex} ******/
                const SCOPE_TRACK = SCOPE_HELPER.createScope("${scopeName}");
                CODE
                SCOPE_TRACK.drop();
                /****** ${state.forIndex} ******/
               }`,
                {
                  preserveComments: true,
                }
              );

              const BlockStatement = tempCode({
                SCOPE_TRACK: state.scopeTrack,
                SCOPE_HELPER: state.scopeHelper,
                CODE: path.node,
              });
              path.replaceWith(BlockStatement);
              path.skip();
              state.forIndex--;
            },
          },
          "BinaryExpression|LogicalExpression": {
            exit(path, state) {
              if (isInTestBinary(path)) {
                const code = generator.default(path.node).code;
                const testAst = template.default(`
                CODE && SCOPE_TRACK.track(EXPRESSION)
                `)({
                  CODE: path.node,
                  EXPRESSION: types.StringLiteral(code),
                  SCOPE_TRACK: state.scopeTrack,
                });
                path.replaceWith(testAst);
                path.skip();
              }
            },
          },
          "AssignmentExpression|UpdateExpression": {
            exit(path, state) {
              const leftPath = path.isUpdateExpression()
                ? path.get("argument")
                : path.get("left");
              let refName = getRefNodeName(leftPath);
              const tempCode = template.default(
                `SCOPE_HELPER.setVariable("REF_NAME",(NODE,REF_NAME))`
              );
              path.replaceWith(
                tempCode({
                  REF_NAME: refName,
                  NODE: path.node,
                  SCOPE_HELPER: state.scopeHelper,
                })
              );
              path.skip();
            },
          },
        },
      },
    ],
  }).code;
  console.log(transformed);
}

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

