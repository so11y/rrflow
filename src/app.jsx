import { createSignal, onMount } from 'solid-js'
import { builder } from "../flow/analysis";
// import { sandBox, __codeRecodeScope__ } from "../flow/core";

// const code = builder(`
// function sumOfOdds(n) {
//     let sum = 0;
//     for (let i = 1; i <= n; i++) {

//       if(i === 5){
//         console.log(5);
//       }else{
//         console.log(6);
//       }
//     }
//     return sum;
//   }
//  sumOfOdds(10)
//   `);
// console.log(code);

// console.log(sandBox(code).__codeRecodeScope__
//   .currentScope);


function App() {
  const [code, setCode] = createSignal(`function sumOfOdds(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    if (i === 5) {
      console.log(5);
    } else {
      console.log(6);
    }
  }
  return sum;
}
sumOfOdds(10);`)
  const [translateCode, setTranslateCode] = createSignal("");
  function translate() {
    setTranslateCode(builder(code()))
  }
  onMount(translate)

  return (
    <div className='min-w-screen min-h-screen  flex'>
      <div className='flex-auto flex flex-col'>
        <button onClick={translate}>编译</button>
        <textarea className='w-full flex-auto' value={code()} onInput={(e) => setCode(e.currentTarget.value)}></textarea>
        <textarea className='flex-auto w-full' value={translateCode()} />
      </div>
      <div className='flex-auto'></div>
    </div>
  )
}

export default App
