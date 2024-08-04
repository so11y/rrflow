import { builder } from "./analysis";
import { sandBox, __codeRecodeScope__ } from "./core";

const code = builder(`
function sumOfOdds(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {

      if(i === 5){
        console.log(5);
      }
    }
    return sum;
  }
 sumOfOdds(10)
  `);
console.log(code);

const _scopeHelper = __codeRecodeScope__();
function sumOfOdds(n) {
  const _scopeTrack = _scopeHelper.getCurrentScopeHelper();
  let sum = 0;
  {
    /****** 0 ******/
    const _scopeTrack = _scopeHelper.createScope("for", 2);
    for (let i = 1; _scopeTrack.test("i <= n", i <= n); i++) {
      {
        /****** 1 ******/
        const _scopeTrack = _scopeHelper.createScope("if", 1);
        if (_scopeTrack.test("i === 5", i === 5)) {
          _scopeHelper.execute("console.log", () => console.log(5));
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
// console.log(sandBox(code).__codeRecodeScope__.currentScope);
