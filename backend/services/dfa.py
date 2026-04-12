from collections import deque

from services.nfa import State, NFA

def epsilon_closure(states: set[State]) -> set[State]:
    """
    Return all states reachable from the given set using only ε-transitions.
    - Start with the given states already in the closure.
    - Repeatedly follow ε-edges outward.
    - Stop when no new states are found.

    Example:
        q0 --ε--> q1 --ε--> q2
        epsilon_closure({q0}) = {q0, q1, q2}
    """

    closure = set(states)
    stack = list(states)

    while stack:
        state = stack.pop()

        for next_state in state.epsilon:
            if next_state not in closure:
                closure.add(next_state)
                stack.append(next_state)

    return closure

def move(states: set[State], symbol:str) -> set[State]:
    """
    Return all states reachable from the given set by consuming one symbol.
    - Look at every state in the input set
    - Follow transitions labeled with the given symbol
    - Collect all destination states

    Example:
        q0 --a--> q1
        q2 --a--> q3

        move({q0, q2}, 'a') = {q1, q3}
    """

    result = set()

    for state in states:
        if symbol in state.transitions:
            result.update(state.transitions[symbol])
    
    return result