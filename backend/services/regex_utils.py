def is_symbol(char: str) -> bool: # Check if character is valid regex symbol
    return char.isalnum() or char == "ε"

def insert_concat(regex: str) -> str: # Insert explicit concatenation operator
    result = []

    for i in range(len(regex)):
        current = regex[i]
        result.append(current)

        if i == len(regex) - 1:
            continue
            
        next_char = regex[i+1]

        left_can_end = is_symbol(current) or current in {')', '*', '+', '?'}
        right_can_start = is_symbol(next_char) or next_char in '('

        if left_can_end and right_can_start:
            result.append('.')

    return ''.join(result)

def precedence(operator: str) -> int: # Define operator precedence
    if operator == '|':
        return 1
    elif operator == '.':
        return 2
    elif operator in {'*', '+', '?'}:
        return 3
    return 0

"""
Shunting Yard Algorithm

- Symbols go straight to output
- Operators go into operator stack
- When higher/equal precedence operator is already on stack, pop it first
- Pop and append operators until '(' when ')' is encountered

Postfix notation is easier to process for NFA construction because
it eliminates the need for parentheses and operator precedence rules during parsing.

Infix -> Postfix
a.(b|c)* -> abc|*.

"""

def to_postfix(regex: str) -> str:
    output = []
    opstack = []

    for char in regex:
        if is_symbol(char):
            output.append(char)

        elif char == '(':
            opstack.append(char)

        elif char == ')':
            # Pop until '(' is found
            while opstack and opstack[-1] != '(':
                output.append(opstack.pop())

            # If no '(' is found, parentheses are mismatched
            if not opstack:
                raise ValueError("Mismatched parentheses")

            # Pop the '('
            opstack.pop()

        else:  # Operator found
            while (
                opstack
                and opstack[-1] != '('
                and precedence(opstack[-1]) >= precedence(char)
            ):
                output.append(opstack.pop())

            opstack.append(char)

    while opstack:
        if opstack[-1] == '(':
            raise ValueError("Mismatched parentheses")
        output.append(opstack.pop())

    return ''.join(output)
            