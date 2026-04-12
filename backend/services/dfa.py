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

def get_alphabet (nfa: NFA) -> set[str]:
    """
    Collect all non-epsilon transition symbols used anywhere in the NFA.
    - During subset construction, each DFA state must process every real input symbol.
    - ε is not part of the alphabet because it does not consume input.

    Example:
        If the NFA has transitions on 'a' and 'b',
        then the alphabet is {'a', 'b'}.
    """

    alphabet = set()
    visited = set()
    stack = [nfa.start]

    while stack:
        state = stack.pop()

        if state in visited:
            continue

        visited.add(state)

        # All keys in state.transitions are real input symbols
        for symbol, targets in state.transitions.items():
            alphabet.add(symbol)

            for target in targets:
                stack.append(target)

        # ε-transitions are followed so we can reach all states,
        # but ε itself is NOT added to the alphabet
        for target in state.epsilon:
            stack.append(target)