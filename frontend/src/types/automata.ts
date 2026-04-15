export type AutomataTransition = {
  from: number
  to: number
  symbol: string
}

export type AutomataData = {
  states: number[]
  start: number
  accepts: number[]
  transitions: AutomataTransition[]
}

export type ThompsonNode =
  | { type: 'literal'; symbol: string }
  | { type: 'concat'; left: ThompsonNode; right: ThompsonNode }
  | { type: 'union'; left: ThompsonNode; right: ThompsonNode }
  | { type: 'star'; child: ThompsonNode }
  | { type: 'plus'; child: ThompsonNode }
  | { type: 'optional'; child: ThompsonNode }

export type ConvertResponse = {
  input: string
  with_concat: string
  postfix: string
  thompson_tree: ThompsonNode
  nfa: AutomataData
  dfa: AutomataData
}