import type { ThompsonNode } from '@/types/automata'
import type { FragmentVisual } from './types'
import { renderLiteral } from './renderLiteral'
import { renderConcat } from './renderConcat'
import { renderUnion } from './renderUnion'
import { renderStar } from './renderStar'

export function renderThompson(
  node: ThompsonNode,
  originX: number,
  originY: number
): FragmentVisual {
  switch (node.type) {
    case 'literal':
      return renderLiteral(node.symbol, originX, originY)

    case 'concat':
      return renderConcat(node.left, node.right, originX, originY)

    case 'union':
      return renderUnion(node.left, node.right, originX, originY)

    case 'star':
      return renderStar(node.child, originX, originY)

    default:
      throw new Error(`Renderer for node type "${node.type}" is not implemented yet`)
  }
}