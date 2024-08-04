
import { Graph } from '@antv/x6'
import { DagreLayout } from '@antv/layout'
import { onMount, createEffect } from 'solid-js'

// import { Graph } from "@antv/graphlib";
// import { CircularLayout } from "@antv/layout";

// const graph = new Graph({ nodes: [], edges: [] });

// const circularLayout = new CircularLayout({ radius: 10 });

// (async () => {
//   // 1. Return positions of nodes & edges.
//   const positions = await circularLayout.execute(graph);

//   // 2. To directly assign the positions to the nodes:
//   await circularLayout.assign(graph);
// })();

function createRenderNode(recode) {
  const nodes = [];
  const stack = [recode];
  const edges = [];
  while (stack.length) {
    const current = stack.pop();
    current.shape = 'rect';
    current.width = 100;
    current.label = current.executeName ?? current.name
    current.height = 40;
    if (current.parent) {
      const where = current.where;
      edges.push({
        source: current.id, target: current.parent.id,
        labels: [
          {
            attrs: {
              label: {
                text: where ? `条件:${where.expression},结果:${where.value}` : '',
              },
            },
          },
        ]
      })
    }
    nodes.push(current);
    if (current.children) {
      stack.push(
        ...current.children
      )
    }
  }
  return {
    nodes,
    edges
  }
}


export default function graph(props) {
  let container;
  let graphImpl;
  onMount(() => {
    graphImpl = new Graph({
      container,
      grid: true,
      background: {
        color: '#F2F7FA',
      },
    })


  })

  createEffect(() => {
    console.log("recode =", props.recode)
    if (props.recode) {
      const layout = new DagreLayout({
        type: 'dagre',
        rankdir: 'LR',
        align: 'UR',
        ranksep: 35,
        nodesep: 15,
      });
      const model = layout.layout(createRenderNode(props.recode));
      graphImpl.fromJSON(model);
    }
  });

  return <div className='flex-auto' ref={container} id="container"></div>
}