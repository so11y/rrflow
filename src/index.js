import { builder } from "./analysis";
import { sandBox, __codeRecodeScope__ } from "./core";

const code = builder(`
  function sumOfOdds(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      if (i < 3) {
        sum += i;
      }else{
        return 555;
      }
    }
    return sum;
  }
 sumOfOdds(10)
  `);

const _scopeHelper = __codeRecodeScope__();
function sumOfOdds(n) {
  const _scopeTrack = _scopeHelper.getCurrentScopeHelper();
  let sum = _scopeHelper.variable("sum", 0);
  {
    /****** 0 ******/
    const _scopeTrack = _scopeHelper.createScope("for");
    for (
      let i = _scopeHelper.variable("i", 1);
      _scopeTrack.test("i <= n", i <= n);
      _scopeHelper.setVariable("i", (i++, i))
    ) {
      {
        /****** 1 ******/
        const _scopeTrack = _scopeHelper.createScope("if");
        if (_scopeTrack.test("i < 3", i < 3)) {
          _scopeHelper.setVariable("sum", ((sum += i), sum));
        } else {
          return _scopeTrack.drop(555, true);
        }
        _scopeTrack.drop();
        /****** 1 ******/
      }
    }
    _scopeTrack.drop();
    /****** 0 ******/
  }
  return _scopeTrack.drop(sum, true);
}
_scopeHelper.execute("sumOfOdds", () => sumOfOdds(10));
_scopeHelper.exit();
console.log(_scopeHelper.currentScope);
