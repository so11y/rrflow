import { transform, packages } from "@babel/standalone";
import { isLoopStatement, getExecutePathName } from "./helper";
import { uniqueId } from "lodash-es";

export function builder(code) {
  const { types, template, generator } = packages;
  return transform(code, {
    plugins: [
      {
        visitor: {
          Program: {
            enter(path, state) {
              state.scopeTrack = path.scope.generateUidIdentifier("scopeTrack");
              state.scopeHelper =
                path.scope.generateUidIdentifier("scopeHelper");
            },
            exit(path, state) {
              const scopeHelper = template.default(`
                const SCOPE_HELPER = __codeRecodeScope__;
              `)({
                SCOPE_HELPER: state.scopeHelper,
              });
              path
                .unshiftContainer("body", scopeHelper)
                .forEach((path) => path.skip());

              const exit = template.default(`SCOPE_HELPER.exit()`)({
                SCOPE_HELPER: state.scopeHelper,
              });

              path.pushContainer("body", exit).forEach((path) => path.skip());
            },
          },
          CallExpression: {
            exit(path, state) {
              const tempCode = template.default`SCOPE_HELPER.execute(EXPRESSION,()=> FN)`;
              path.replaceWith(
                tempCode({
                  FN: path.node,
                  EXPRESSION: getExecutePathName(path.get("callee")),
                  SCOPE_HELPER: state.scopeHelper,
                }).expression
              );
              path.skip();
            },
          },
          ReturnStatement: {
            exit(path, state) {
              const tempCode = template.default`
              return SCOPE_TRACK.drop(NODE,true)
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
              if (path.key === "alternate") {
                return;
              }
              const tempCode = template.default(
                `{
                /****** ${state.forIndex} ******/
                const SCOPE_TRACK = SCOPE_HELPER.createScope("${scopeName}",${uniqueId()});
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
              if (path.key === "test") {
                const code = generator.default(path.node).code;
                const testAst = template.default(
                  `SCOPE_TRACK.test(EXPRESSION,CODE)`
                )({
                  CODE: path.node,
                  EXPRESSION: types.StringLiteral(code),
                  SCOPE_TRACK: state.scopeTrack,
                });
                path.replaceWith(testAst);
                path.skip();
              }
            },
          },
          "FunctionDeclaration|ArrowFunctionExpression|ObjectMethod": {
            exit(path, state) {
              const trackHelper = template.default(`
                  const SCOPE_TRACK = SCOPE_HELPER.getCurrentScopeHelper()
                  `)({
                SCOPE_TRACK: state.scopeTrack,
                SCOPE_HELPER: state.scopeHelper,
              });
              path
                .get("body")
                .unshiftContainer("body", trackHelper)
                .forEach((path) => path.skip());
            },
          },
        },
      },
    ],
  }).code;
}
