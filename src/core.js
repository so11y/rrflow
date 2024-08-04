import { cloneDeep, isFunction } from "lodash-es";
export function __codeRecodeScope__() {
  const scopeHelperCache = new WeakMap();
  const scopeHelper = {
    _scope: [],
    _isExit: false,
    currentScope: null,
    createScope(name) {
      const newScope = {
        name,
        parent: scopeHelper.currentScope,
        /** dyn keys */
        /**
         *   returned: undefined,
         *   var:{}
         *   function:{},
         *   children:[]
         *   dirtyChange:{} 修改了哪一些值
         */
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
            dropScope.isDrop = true;
            scopeHelper.currentScope = dropScope.parent;
            if (exit) {
              dropScope.returned = cloneDeep(value);
            }
          }
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
    execute(name, fn) {
      const scopeTrack = scopeHelper.createScope("fn");
      const scope = scopeHelper.currentScope;
      scope.executeName = name;
      let value = fn();
      if (!scope.isDrop) {
        scope.returned = cloneDeep(value);
        scopeTrack.drop(value);
      }
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
  scopeHelper.createScope("global");
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
