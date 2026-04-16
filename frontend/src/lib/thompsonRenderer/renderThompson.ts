import type { ThompsonNode } from '@/types/automata'
import type { FragmentVisual } from './types'
import { renderLiteral } from './renderLiteral'
import { renderConcat } from './renderConcat'
import { renderUnion } from './renderUnion'
import { renderStar } from './renderStar'
import { renderPlus } from './renderPlus'
import { renderOptional } from './renderOptional'

function assertNever(value: never): never {
  throw new Error('Unhandled Thompson node type')
}

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

    case 'plus':
      return renderPlus(node.child, originX, originY)

    case 'optional':
      return renderOptional(node.child, originX, originY)

    default:
      return assertNever(node)
  }
}