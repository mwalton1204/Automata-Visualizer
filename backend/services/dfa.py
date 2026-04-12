from collections import deque

from services.nfa import State, NFA

class DFA:
    def __init__(self, start_state, accept_states, transitions, alphabet):
        self.start_state = start_state
        self.accept_states = accept_states
        self.transitions = transitions
        self.alphabet = alphabet

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

    return alphabet

def nfa_to_dfa(nfa: NFA) -> DFA:
    """
    Convert an NFA into a DFA using subset construction.
    - Each DFA state is a set of NFA states
    - Start DFA state = ε-closure({nfa.start})
    - For each DFA state and each input symbol:
        1. move on that symbol
        2. take ε-closure of the result
        3. that becomes a new DFA state
    - Repeat until no new DFA states are discovered

    A DFA state is accepting if it contains the NFA accept state.
    """

    alphabet = get_alphabet(nfa)

    # Start DFA state is the epsilon closure of the NFA start state
    start_state = frozenset(epsilon_closure({nfa.start}))

    # List of DFA states that still need to be processed
    stack = [start_state]

    # Set of all discovered DFA states
    dfa_states = {start_state}

    # DFA transition table:
    # { current_dfa_state: { symbol: next_dfa_state } }
    transitions = {}

    # Set of accepting DFA states
    accept_states = set()

    while stack:
        current = stack.pop()

        # Ensure current DFA state has a transition dictionary
        transitions[current] = {}

        # If the NFA accept state is in this set, this is an accepting DFA state
        if nfa.accept in current:
            accept_states.add(current)
        
        # try every real input symbol from this DFA state
        for symbol in alphabet:
            moved = move(set(current), symbol)

            # If no states reachable on this symbol, skip it for now
            if not moved:
                continue
                
            next_state = frozenset(epsilon_closure(moved))

            transitions[current][symbol] = next_state

            # If this is a new DFA state, save it to be processed later
            if next_state not in dfa_states:
                dfa_states.add(next_state)
                stack.append(next_state)
        
    return DFA(start_state, accept_states, transitions, alphabet)