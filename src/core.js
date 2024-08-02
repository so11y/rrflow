import { cloneDeep, isFunction } from "lodash-es";

const runInSandBox = (src) => {
  src = `with (sandbox) { ${src} }`;
  const code = new Function("sandbox", src);

  return (sandbox) => {
    const context = new Proxy(sandbox, {
      has() {
        return true;
      },
      get(target, key) {
        if (key === Symbol.unscopables) return undefined;
        return target[key];
      },
    });
    code(context);
    return context;
  };
};

let code = `
console.log(aa,'---');
`;

// runInSandBox(code)({
//   aa: 1,
//   Math,
//   console,
// });

const scope = () => {
  const scopeHelper = {
    record: [],
    _scope: [],
    currentScope: null,
    createScope(name) {
      const newScope = {
        name,
        var: {},
        function: {},
        parent: scopeHelper.currentScope,
        returned: undefined,
      };
      scopeHelper._scope.push(newScope);
      scopeHelper.currentScope = newScope;
      return {
        drop: (value) => {
          const isDrop = scopeHelper._scope.findIndex(
            (scope) => scope === newScope
          );
          if (isDrop === scopeHelper._scope.length - 1) {
            const dropScope = scopeHelper._scope.pop();
            scopeHelper.currentScope = dropScope.parent;
            dropScope.returned = cloneDeep(value);
            scopeHelper.record.unshift(dropScope);
          }
        },
      };
    },
    callFn(fn) {
      const scope = scopeHelper.createScope("fn");
      let value = fn();
      scope.returned = cloneDeep(value);
      scope.drop(value);
      return value;
    },
    variable(key, value) {
      const isValueFunction = isFunction(value);
      scopeHelper.currentScope[isValueFunction ? "function" : "var"][key] = {
        value,
        recode: [],
      };
      return value;
    },
    setVariable(key, value) {
      const scope = scopeHelper.currentScope;
      if (scope.var[key]) {
        scope.var[key].value = value;
        scope.var[key].recode.push(cloneDeep(value));
      }
    },
    exit() {
      let globalScope = scopeHelper.currentScope;
      while (!globalScope.name === "global") {
        globalScope = scopeHelper.currentScope.parent;
      }
      scopeHelper.record.unshift(globalScope);
      return scopeHelper.record;
    },
  };
  scopeHelper.createScope("global");
  return scopeHelper;
};
const {
  dropScope,
  createScope,
  variable,
  getVariable,
  setVariable,
  dropVariable,
  exit,
  record,
  callFn,
} = scope();
// function main() {
//   // const {
//   //   dropScope,
//   //   createScope,
//   //   variable,
//   //   getVariable,
//   //   setVariable,
//   //   dropVariable,
//   //   exit,
//   // } = scope();
//   let index = variable("index", 0);
//   const { drop } = createScope("for");
//   //----0
//   for (
//     let index = variable("index", 0);
//     index < 10;
//     setVariable("index", (index++, index))
//   ) {
//     console.log(index);
//   }
//   drop();
//   //-----0
//   setVariable("index", ++index);
// }

// main();
// exit();
// console.log(record);

function main() {
  let index1 = variable("index1", { a: 1 });
  console.log(index);
  let index = variable("index", function (value22) {
    console.log(value);
    let index2 = variable("index2", { a: 1 });
    setVariable("index2", ((index2.a += 5), index2));
    setVariable("index1", ((index1.a += 5), index1));
    return 546;
  });

  callFn(() => a.b.c(1));
}

main();
exit();
console.log(record);

// for (
//   let index = variable("index", 0);
//   index < 10;
// index<5? index+=1:index--
//  ) {

//  }
