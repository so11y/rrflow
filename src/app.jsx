import { createSignal, onMount } from 'solid-js'
import { builder } from "../flow/analysis";
import { sandBox, } from "../flow/core";
import Graph from "./graph"


function App() {
  const [code, setCode] = createSignal(`function sumOfOdds(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    if (i === 2) {
      console.log(5);
    } else {
      console.log(6);
    }
  }
  return sum;
}
sumOfOdds(10);`)
  const [translateCode, setTranslateCode] = createSignal("");
  const [recode, setRecode] = createSignal(null)
  function translate() {
    setTranslateCode(builder(code()))
    try {
      setRecode(sandBox(translateCode()).__codeRecodeScope__
        .currentScope)
    } catch (error) {
      console.error(error)
    }

  }
  onMount(translate)

  return (
    <div className='min-w-screen min-h-screen  flex p-8px  box-border'>
      <div className='w-40% flex flex-col'>
        <button onClick={translate}>编译</button>
        <textarea className='w-full flex-auto resize-none' value={code()} onInput={(e) => setCode(e.currentTarget.value)}></textarea>
        <textarea readOnly className='flex-auto w-full' value={translateCode()} />
      </div>
      <Graph recode={recode()} />
    </div>
  )
}

export default App
