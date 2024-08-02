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
      const scope = scopeHelper.createScope("fn");
      let value = fn();
      scope.name = name;
      scope.returned = cloneDeep(value);
      scope.drop(value);
      return value;
    },
    variable(key, value) {
      const isValueFunction = isFunction(value);
      const visitorKey = isValueFunction ? "function" : "var";
      if (!scopeHelper.currentScope[visitorKey]) {
        scopeHelper.currentScope[visitorKey] = {};
      }
      scopeHelper.currentScope[visitorKey][key] = {
        value,
        recode: [],
      };
      return value;
    },
    setVariable(key, value) {
      let scope = scopeHelper.currentScope;
      while (!scope.var || !Reflect.has(scope.var, key)) {
        scope = scope.parent;
      }
      scope.var[key].recode.push({
        value,
        ordValue: cloneDeep(scope.var[key].value),
        changeScope: scopeHelper.currentScope,
      });
      scope.var[key].value = value;
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
