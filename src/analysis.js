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

export function builder(code) {
  const { types, template, generator } = packages;
  return transform(code, {
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
}
