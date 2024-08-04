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
console.log(sandBox(code).__codeRecodeScope__.currentScope);
