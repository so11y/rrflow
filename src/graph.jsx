import { Graph } from "@antv/x6";
import { DagreLayout } from "@antv/layout";
import { onMount, createEffect } from "solid-js";

function createRenderNode(recode) {
  const nodes = [];
  const stack = [recode];
  const edges = [];
  while (stack.length) {
    const current = stack.pop();
    current.shape = "rect";
    current.id = current.id.toString();
    current.size = {
      width: 100,
      height: 40,
    };
    current.label = current.executeName ?? current.name;
    if (current.parent) {
      const where = current.where;
      edges.push({
        source: current.parent.id,
        target: current.id,
        labels: [
          {
            attrs: {
              label: {
                text: where
                  ? `条件:${where.expression},结果:${where.value}`
                  : "",
              },
            },
          },
        ],
      });
    }
    nodes.push(current);
    if (current.children) {
      stack.push(...current.children);
    }
  }
  return {
    nodes,
    edges,
  };
}

export default function graph(props) {
  let container;
  let graphImpl;
  onMount(() => {
    graphImpl = new Graph({
      container,
      grid: true,
      background: {
        color: "#F2F7FA",
      },
    });
  });

  createEffect(() => {
    console.log("recode =", props.recode);
    if (props.recode) {
      const layout = new DagreLayout({
        type: "dagre", // 布局类型
        rankdir: "TB", // 布局的方向
        nodesep: "30", // 节点间距
        ranksep: "0", // 层间距
      });
      console.log(
        createRenderNode(props.recode),'-'
      );
      const model = layout.layout(createRenderNode(props.recode));
      graphImpl.fromJSON(model);
      graphImpl.centerContent();
      graphImpl.zoomToFit({
        padding: {
          left: 10,
          right: 10,
        },
      });
    }
  });

  return <div className="flex-auto" ref={container} id="container"></div>;
}
