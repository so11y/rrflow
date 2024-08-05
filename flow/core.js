import { cloneDeep, uniqueId } from "lodash-es";
export function __codeRecodeScope__() {
  const scopeHelperCache = new WeakMap();
  const scopeHelper = {
    _scope: [],
    _isExit: false,
    currentScope: null,
    createScope(name, id) {
      const prevScope = scopeHelper.currentScope;
      if (prevScope && id && prevScope.children) {
        const scope = prevScope.children.find((child) => child.id === id);
        if (scope) {
          scopeHelper.currentScope = scope;
          return scopeHelperCache.get(scope);
        }
      }
      const newScope = {
        id,
        name,
        parent: scopeHelper.currentScope,
        where: prevScope?.test?.at(-1) || null,
      };
      if (scopeHelper.currentScope) {
        if (!scopeHelper.currentScope.children) {
          scopeHelper.currentScope.children = [];
        }
        scopeHelper.currentScope.children.push(newScope);
      }
      scopeHelper._scope.push(newScope);
      scopeHelper.currentScope = newScope;
      scopeHelperCache.set(newScope, {
        test(expression, value) {
          const scope = newScope;
          if (!scope.test) {
            scope.test = [];
          }
          scope.test.push({
            expression,
            value,
          });
          return value;
        },
        drop: (value, exit) => {
          const isDrop = scopeHelper._scope.findIndex(
            (scope) => scope === newScope
          );
          if (isDrop === scopeHelper._scope.length - 1) {
            const dropScope = scopeHelper._scope.pop();
            scopeHelperCache.get(newScope).isDrop = true;
            if (exit) {
              dropScope.returned = cloneDeep(value);
            }
          }
          scopeHelper.currentScope = newScope.parent;
          if (exit && scopeHelper.currentScope.name === "global") {
            scopeHelper.exit();
          }
        },
      });
      return scopeHelperCache.get(newScope);
    },
    getCurrentScopeHelper() {
      return scopeHelperCache.get(scopeHelper.currentScope);
    },
    execute(name, fn, id) {
      const scopeTrack = scopeHelper.createScope("fn", id);
      const scope = scopeHelper.currentScope;
      scope.executeName = name;
      let value = fn();
      if (!scopeHelperCache.get(scope).isDrop) {
        scope.returned = cloneDeep(value);
        scopeTrack.drop(value);
      }
      scopeHelper.currentScope = scope.parent;
      console.log(scopeHelper.currentScope, "---");
      return value;
    },
    exit() {
      let globalScope = scopeHelper.currentScope;
      if (!scopeHelper._isExit) {
        while (globalScope.name !== "global") {
          scopeHelperCache.get(globalScope).drop();
          globalScope = globalScope.parent;
        }
      }
      return globalScope;
    },
  };
  scopeHelper.createScope("global", uniqueId());
  return scopeHelper;
}

const runInSandBox = (sandbox) => {
  const context = new Proxy(sandbox, {
    has: () => true,
    get(target, key) {
      if (key === Symbol.unscopables) return undefined;
      return target[key];
    },
  });
  return (rawCode) => {
    const code = new Function(
      "sandbox",
      `with (sandbox) {
      ${rawCode}
     }`
    );
    code(context);
    return context;
  };
};

export function sandBox(code) {
  return runInSandBox({
    Math,
    console,
    __codeRecodeScope__: __codeRecodeScope__(),
  })(code);
}
