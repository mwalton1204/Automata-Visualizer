import type { FragmentVisual } from './types'

export function offsetFragment(
  fragment: FragmentVisual,
  dx: number,
  dy: number
): FragmentVisual {
  return {
    ...fragment,
    nodes: fragment.nodes.map((node) => ({
      ...node,
      x: node.x + dx,
      y: node.y + dy,
    })),
    edges: [...fragment.edges],
  }
}