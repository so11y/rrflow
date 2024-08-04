import { packages } from "@babel/standalone";

export function getExecutePathName(path) {
  const { generator, types } = packages;
  switch (path.type) {
    case "Identifier":
      return types.StringLiteral(path.node.name);
    case "MemberExpression": {
      return types.StringLiteral(generator.default(path.node).code);
    }
  }
  throw `不支持`;
}

export function isLoopStatement(path) {
  const { types } = packages;
  const validates = [types.isForStatement, types.isWhileStatement];
  return validates.some((validate) => validate(path));
}
