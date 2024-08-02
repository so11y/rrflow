import destructuring from "@babel/plugin-transform-destructuring";
import { transform, packages } from "@babel/standalone";

function builder(code) {
  const { types, template } = packages;
  const transformed = transform(code, {
    plugins: [
      destructuring,
      {
        visitor: {
          VariableDeclaration: {
            exit(path) {
              path.get("declarations").forEach((decPath) => {
                const tempCode = template.default`variable(NAME,CODE)`;
                const newCode = tempCode({
                  NAME: types.StringLiteral(decPath.get("id.name").node),
                  CODE: decPath.get("init").node,
                }).expression;
                decPath.set("init", newCode);
              });
              path.skip();
            },
          },
          CallExpression: {
            exit(path) {
              const tempCode = template.default`callFn(()=> FN)`;
              path.replaceWith(
                tempCode({
                  FN: path.node,
                }).expression
              );
              path.skip();
            },
          },
          ForStatement: {
            enter(_, state) {
              if (state.forIndex === undefined) {
                state.forIndex = 0;
              } else {
                state.forIndex++;
              }
            },
            exit(path, state) {
              const tempCode = template.default(`{
                const {drop} = createScope("for");
                CODE
                drop();
              }`);
              const BlockStatement = tempCode({
                CODE: path.node,
              });
              // const comments = {
              //   value: `----${state.forIndex}`,
              // };
              // BlockStatement.leadingComments = [comments];
              // BlockStatement.trailingComments = [comments];
              path.replaceWith(BlockStatement);
              path.skip();
              state.forIndex--;
            },
          },
          ReturnStatement: {
            exit(path) {
              const tempCode = template.default`
              return drop(NODE)
              `;
              path.replaceWith(
                tempCode({
                  NODE: path.get("argument").node,
                })
              );
              path.skip();
            },
          },
          BreakStatement: {
            exit(path) {
              const nodes = [
                types.CallExpression(types.Identifier("drop"), []),
                path.node,
              ];
              const newPath = path.replaceWithMultiple(nodes);
              newPath.forEach((path) => path.skip());
            },
          },
        },
      },
    ],
  }).code;
  console.log(transformed);
}

builder(`
function main(){
  for (let index = 0; index < 10; index++) {
    let index1 = 0;
  
    if (index  === 5) {
      return 5;
    }
    break;
  }
}
`);

// let a1 = function () {
//   let index1 = 0;
//   let index2 = 0;
// };
// a1();

// for (let index = 0; index < 10; index++) {
//   let index1 = 0;

//   if (index  === 5) {
//     return 5;
//   }
// }
