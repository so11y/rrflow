import destructuring from "@babel/plugin-transform-destructuring";
import { transform, packages } from "@babel/standalone";

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
                const SCOPE_TRACK = SCOPE_HELPER.createScope("for");
                CODE
                SCOPE_TRACK.drop();
              }`);
              const BlockStatement = tempCode({
                SCOPE_TRACK: state.scopeTrack,
                SCOPE_HELPER: state.scopeHelper,
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
          IfStatement: {
            exit(path, state) {
              const test = path.get("test");
              const code = generator.default(test.node).code;

              const testAst = template.default(`
              ${code} && SCOPE_TRACK.track("${code}")
              `)({
                SCOPE_TRACK: state.scopeTrack,
              });

              path.set("test", testAst.expression);

              const tempCode = template.default(`{
                const SCOPE_TRACK = SCOPE_HELPER.createScope("if");
                CODE
                SCOPE_TRACK.drop();
              }`);

              const BlockStatement = tempCode({
                SCOPE_TRACK: state.scopeTrack,
                SCOPE_HELPER: state.scopeHelper,
                CODE: path.node,
              });

              path.replaceWith(BlockStatement);
              path.skip();
            },
          },
        },
      },
    ],
  }).code;
  console.log(transformed);
}

builder(`
let a1 = 5;
let {so} = so1();

if(a++){}

for (let index = 0; index < 10; index++) {
  let index1 = 0;

  if (index  === 5) {
      break;
  }
}

console.log(6);
`);

// let a1 = 5;
// if(a++){}

// for (let index = 0; index < 10; index++) {
//   let index1 = 0;

//   if (index  === 5) {
//   break;
//   }
// }

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

// function main(){
//   for (let index = 0; index < 10; index++) {
//     let index1 = 0;

//     if (index  === 5) {
//       return 5;
//     }
//     break;
//   }
// }

// const {aa1,bb2}  = [];
// const {aa3,aa4} = xx();
