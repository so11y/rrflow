function builder(code) {
  const { types, template, traverse, generator } = Babel.packages;
  const transformed = Babel.transform(code, {
    plugins: [
      {
        visitor: {
          VariableDeclaration: {
            exit(path) {
              path.get("declarations").map((decPath) => {
                const temp = `${path.get('kind').node} xx  = variable(xx,xx)`;
                const tempCode = template.default`${temp}`;
                const newCode = tempCode({
                  // NAME: decPath.get("id").node,
                  // CODE: decPath.get("init").node,
                });

                console.log(newCode.expression);
                // decPath.set("init", newCode);
                return newCode.expression
              });
              path.skip();
            },
          },
          CallExpression: {
            exit(path) {
              const tempCode = template.default`callFn(()=> FN)`;
              path.replaceWith(
                tempCode({
                  FN: path.node,
                }).expression
              );
              console.log(456);
              path.skip();
            },
          },
          ForStatement: {
            enter(_, state) {
              if (state.forIndex === undefined) {
                state.forIndex = 0;
              } else {
                state.forIndex++;
              }
            },
            exit(path, state) {
              const tempCode = template.default`
            {
              const {drop}= createScope("for");
              CODE
              drop();
            }
              `;
              path.replaceWith(
                tempCode({
                  CODE: path.node,
                })
              );
              path.skip();
              state.forIndex--;
            },
          },
        },
      },
    ],
  }).code;

  console.log(transformed, "-");
}

builder(`

const {a} = aa;
`);

// let a1 = function(){
//   let index1 = 0;
//   let index2 = 0;
// }
//   a1();

//     for (
//     let index = 0;
//     index < 10;
// index++
//    ) {

//      let index1 = 0;
//    }

// var xx = {a:1};
// let a = vaa("a",xx,1)
// let b = vaa("b",xx,2)

// path.get("declarations").forEach((decPath) => {
//   const tempCode = template.default`variable(NAME,CODE)`;
//   console.log(decPath.get("id").node, "--");
//   const newCode = tempCode({
//     NAME: decPath.get("id").node,
//     CODE: decPath.get("init").node,
//   }).expression;
//   console.log(generator.default((decPath.get("id").node)));
//   // decPath.set("init", newCode);
// });
// path.skip();
