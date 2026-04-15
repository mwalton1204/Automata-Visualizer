from typing import Any


def postfix_to_thompson_tree(postfix: str) -> dict[str, Any]:
    stack: list[dict[str, Any]] = []

    for char in postfix:
        if char in {'*', '+', '?'}:
            if not stack:
                raise ValueError(f"Missing operand for unary operator '{char}'")

            child = stack.pop()

            node_type = {
                '*': 'star',
                '+': 'plus',
                '?': 'optional',
            }[char]

            stack.append({
                'type': node_type,
                'child': child,
            })

        elif char in {'.', '|'}:
            if len(stack) < 2:
                raise ValueError(f"Missing operands for binary operator '{char}'")

            right = stack.pop()
            left = stack.pop()

            node_type = {
                '.': 'concat',
                '|': 'union',
            }[char]

            stack.append({
                'type': node_type,
                'left': left,
                'right': right,
            })

        else:
            stack.append({
                'type': 'literal',
                'symbol': char,
            })

    if len(stack) != 1:
        raise ValueError("Invalid postfix expression")

    return stack[0]