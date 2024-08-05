import { Graph } from "@antv/x6";
import { DagreLayout } from "@antv/layout";
import { onMount, createEffect, children } from "solid-js";
import { isEqual, uniqueId } from "lodash-es";

function getLabelText(recodeEl) {
  switch (recodeEl.parent.name) {
    case "for": {
      return `x${recodeEl.parent.test.length - 1}`
    }
  }
  if (recodeEl.parent.name === "if") {
    const where = recodeEl.where;
    if (where) {
      return `条件:${where.expression},结果:${where.value}`
    }
  }
  return ""

}

function zipIfNode(ifEl) {
  const branch = [];
  if (ifEl.children) {
    ifEl.children.forEach(child => {
      let findBranch = branch.find(i => isEqual(i.branch, child.where))
      if (!findBranch) {
        findBranch = {
          branch: child.where,
          nodes: []
        }
        branch.push(findBranch)
      }
      findBranch.nodes.push(child);
    })
  }
  const children = branch.map(b => {
    const newParent = {
      id: uniqueId(),
      parent: ifEl,
      shape: undefined,
      fakeNode: true,
      where: b.branch,
      shape: 'ellipse',
      size: {
        width: 150,
        height: 40,
      },
      children: b.nodes || []
    }
    newParent.name = getLabelText(newParent);
    b.nodes.forEach((child) => {
      child.rawParent = child.parent;
      child.parent = newParent;
    })
    return newParent
  })
  return {
    ...ifEl,
    children
  }
}

function createRenderNode(recode) {
  console.log(recode, '-');
  const nodes = [];
  const stack = [recode];
  const edges = [];
  while (stack.length) {
    let current = stack.pop();
    current.id = current.id.toString();
    if (current.name === "if") {
      current = zipIfNode(current);
    }
    if (!current.size) {
      current.size = {
        width: 100,
        height: 40,
      };
    }
    current.label = current.executeName ?? current.name;
    if (current.parent) {
      edges.push({
        source: current.parent.id,
        target: current.id,
        labels: [
          {
            attrs: {
              label: {
                text: current.fakeNode ? "" : getLabelText(current)
              },
            },
          },
        ],
      });
    }

    nodes.push(current);
    if (current.children) {
      console.log(current.children, '---');
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
    if (props.recode) {
      const layout = new DagreLayout({
        type: "dagre",
        rankdir: "TB",
        nodesep: "30",
        ranksep: "0",
      });
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
