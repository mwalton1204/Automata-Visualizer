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

    stack = []

    for char in postfix:

        # SYMBOL
        # Create the simplest NFA:
        #   start --char--> accept
        if is_symbol(char):
            start = State()
            accept = State()

            # From start, on this symbol, go to accept
            start.transitions.setdefault(char, set()).add(accept)

            stack.append(NFA(start, accept))

        # UNARY OPERATORS (*, +, ?)
        # Operate on ONE fragment
        elif char in {'*', '+', '?'}:
            nfa = stack.pop()

            start = State()
            accept = State()

            if char == '*':
                # Kleene star (0 or more)
                # - can skip entirely
                # - can loop infinitely
                start.epsilon.add(nfa.start)
                start.epsilon.add(accept)

                nfa.accept.epsilon.add(nfa.start)
                nfa.accept.epsilon.add(accept)

            elif char == '+':
                # One or more
                # - must go through fragment once
                # - then can loop
                start.epsilon.add(nfa.start)

                nfa.accept.epsilon.add(nfa.start)
                nfa.accept.epsilon.add(accept)

            elif char == '?':
                # Optional (0 or 1)
                # - either skip
                # - or go through once
                start.epsilon.add(nfa.start)
                start.epsilon.add(accept)

                nfa.accept.epsilon.add(accept)

            stack.append(NFA(start, accept))

        # CONCATENATION (.)
        # Combine two fragments: left followed by right
        elif char == '.':
            right = stack.pop()  # second operand
            left = stack.pop()   # first operand

            # Connect left → right
            left.accept.epsilon.add(right.start)

            stack.append(NFA(left.start, right.accept))

        # UNION (|)
        # Branch: choose left OR right
        elif char == '|':
            right = stack.pop()
            left = stack.pop()

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