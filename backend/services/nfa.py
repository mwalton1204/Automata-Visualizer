from services.regex_utils import is_symbol

class State:
    def __init__(self):
        self.transitions = {} # symbol -> set of states
        self.epsilon = set() # ε-transitions

class NFA:
    def __init__(self, start: State, accept: State):
        self.start = start
        self.accept = accept

def postfix_to_nfa(postfix: str) -> NFA:
    """
    Convert a postfix regular expression into an NFA using Thompson's construction.

    - Read the postfix expression left → right
    - Use a stack to store partial NFA fragments
    - Each fragment has:
        - start state
        - accept state
    - When we see:
        - a symbol → create a basic NFA and push it
        - a unary operator (*, +, ?) → pop 1 fragment, modify it, push result
        - a binary operator (., |) → pop 2 fragments, combine them, push result
    - At the end, exactly one NFA should remain on the stack

    Why postfix works:
    - Operators come AFTER their operands
    - So when we see an operator, the required fragments are already on the stack
    """

    stack = []

    for char in postfix:

        # SYMBOL
        # start -- char --> accept
        if is_symbol(char):
            start = State()
            accept = State()

            # From start, on this symbol, go to accept
            start.transitions.setdefault(char, set()).add(accept)

            stack.append(NFA(start, accept))

        # UNARY OPERATORS (*, +, ?)
        elif char in {'*', '+', '?'}:
            nfa = stack.pop()

            start = State()
            accept = State()

            if char == '*': # Zero or more
                
                # Can skip entirely
                start.epsilon.add(nfa.start) 
                start.epsilon.add(accept)

                # Or can loop infinitely
                nfa.accept.epsilon.add(nfa.start)
                nfa.accept.epsilon.add(accept)

            elif char == '+': # One or more

                # Must go through fragment once
                start.epsilon.add(nfa.start)

                # Then can loop
                nfa.accept.epsilon.add(nfa.start)
                nfa.accept.epsilon.add(accept)

            elif char == '?': # Either zero or one
                
                # Either skip
                start.epsilon.add(nfa.start)
                start.epsilon.add(accept)

                # Or go through once
                nfa.accept.epsilon.add(accept)

            stack.append(NFA(start, accept))

        # CONCATENATION (.)
        # Combine two fragments: left followed by right
        elif char == '.':
            right = stack.pop()  # second operand
            left = stack.pop()   # first operand

            # Connect left -> right
            left.accept.epsilon.add(right.start)

            stack.append(NFA(left.start, right.accept))

        # UNION (|)
        # Branch: choose left OR right
        elif char == '|':
            right = stack.pop() # second operand
            left = stack.pop()# first operand

            start = State()
            accept = State()

            # New start branches into both fragments
            start.epsilon.add(left.start)
            start.epsilon.add(right.start)

            # Both fragments merge into new accept
            left.accept.epsilon.add(accept)
            right.accept.epsilon.add(accept)

            stack.append(NFA(start, accept))

        else:
            raise ValueError(f"Unsupported operator: {char}")

    # Final check: exactly one NFA should remain
    if len(stack) != 1:
        raise ValueError("Invalid postfix expression")

    return stack[0]

def nfa_to_dict(nfa: NFA) -> dict:
    """
    Convert an NFA made of linked State objects into a JSON-friendly dictionary.

    Since State objects reference each other directly, we first assign each
    reachable state a numeric ID, then collect all transitions using those IDs.
    """

    state_ids = {}
    transitions = []
    stack = [nfa.start]
    next_id = 0

    # First pass: discover all reachable states and assign IDs
    while stack:
        state = stack.pop()

        if state in state_ids:
            continue

        state_ids[state] = next_id
        next_id += 1

        for targets in state.transitions.values():
            for target in targets:
                stack.append(target)

        for target in state.epsilon:
            stack.append(target)

    # Second pass: collect transitions using assigned IDs
    for state, state_id in state_ids.items():
        for symbol, targets in state.transitions.items():
            for target in targets:
                transitions.append({
                    "from": state_id,
                    "to": state_ids[target],
                    "symbol": symbol
                })

        for target in state.epsilon:
            transitions.append({
                "from": state_id,
                "to": state_ids[target],
                "symbol": "ε"
            })

    return {
        "states": list(state_ids.values()),
        "start": state_ids[nfa.start],
        "accept": state_ids[nfa.accept],
        "transitions": transitions
    }