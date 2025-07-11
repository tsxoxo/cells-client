# Cells

7th task of the [7 GUIs](https://eugenkiss.github.io/7guis/tasks/#cells).

Made with [Vue](https://vuejs.org/) and [Xstate](https://stately.ai/docs) -- a framework for using finite state machines (FSM).

---

[Live version](https://tsxoxo.github.io/7GUIs-Xstate-Vue--7.Cells/)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tsxoxo/7GUIs-Xstate-Vue--6.Cells)

---

[Diagram in Stately Studio](https://stately.ai/registry/editor/6782ed10-3960-405b-8d20-47a05f5bb92c?machineId=b0690012-5357-4cf2-b293-6e096d531e5c)

---

# Resources

## Testing

- [Youtube tutorial](https://www.youtube.com/watch?v=SauvYKQGzXE)
- [Slightly hidden Xstate docs](https://graph-docs.vercel.app/model-based-testing/intro)

## Going Further

- Alternatives to State Machines?: [sum types and discriminated unions](https://www.google.com/search?q=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&sca_esv=61c64a259e7d732d&hl=en&sxsrf=AHTn8zrTu46-V4JABk7UKLuK4GUoZGqhOg%3A1738328579715&ei=A8qcZ5WsK-K2i-gPsPGM8AE&ved=0ahUKEwjVufzLgqCLAxVi2wIHHbA4Ax4Q4dUDCBE&uact=5&oq=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&gs_lp=Egxnd3Mtd2l6LXNlcnAiQHN0YXRlIG1hY2hpbmUgYWx0ZXJuYXRpdmVzICdzdW0gdHlwZXMnIE9SICdkaXNjcmltaW5hdGVkIHVuaW9ucydIuHBQwgZYk2xwBHgBkAEAmAGfAaAB2hqqAQQ4LjI1uAEDyAEA-AEBmAIZoAKwFcICChAAGLADGNYEGEfCAgUQIRigAcICBxAhGKABGArCAgQQIRgVwgIIEAAYgAQYogTCAgUQABjvBZgDAIgGAZAGCJIHBDIuMjOgB89d&sclient=gws-wiz-serp)
- Simplify working with immutable states: [Immer](https://immerjs.github.io/immer/)

## Related Projects

- [Tic-Tac-Toe](https://github.com/statelyai/xstate/blob/main/examples/tic-tac-toe-react/src/ticTacToeMachine.ts)
- [Tiles](https://github.com/statelyai/xstate/blob/main/examples/tiles/src/tilesMachine.ts)

---

# TODO

**@CURRENT**: Systematize tests and errors

## Make testing more sane

_Make testing more sane and complete_
Big picture:

- bring test data and implementations closer together
- make testing more exhaustive/robust: i want to understand better what cases i am covering.

* implement tests for basic properties using fast-check. then reassess the question.

**Property tests**

- The whole parse pipeline never crashes on any string
- Tokenizer handles all single valid tokens
- AST nodes have required fields
- valid token sequence produces AST (seems hard to generate)
- error msgs point to the right token (how to do that?)
- it never silently produces wrong result (???)
- "Tokenization is always unambiguous" (is "A1" always a cell, never "A" followed by "1"?)

**valid cases**
[x] handles valid cell refs
[x] deps: result contains correct dependencies

**invalid cases**
returns appropiate error:
[x] CELL_NOT_A_NUMBER

[x] test funcs A: all cells valid

- **tidy up example tests**
- write integration tests for full parsing pipeline
- Go over the properties mentioned above under "Property tests" -- add any of those?

**TEST CASES TO ADD**

- whitespace between nums and cells: "12 23 + 23", "A1 A2+1"
- no whitespace between num and letter: "123sum(A1:B2)"

## After that

- simplify project structure. see Gemini chat "cells: Data-Oriented Parsing of Function Expressions"

- Try and simplify/unify each module of the parse pipeline. Underlying question: this whole parsing business seems like a state machine pattern--roughly:
  `state: {name: expect_open_bracket, onFail: createError, onSuccess: consumeNext}`.

    - all: do everything with a switch statement?
    - ast: why do I use a 'return early on fail' pattern in parseFactor under case('func'), while nesting in parseRange?
    - ast: it does not make sense to me that consume() returns a value, yet we never use that return value, instead calling it strictly for its side-effects.
    - tokenize: try to make parseFactor be aware of possible tokens instead of casting `token.type as never`
    - tokenize: consider this control flow: parseNumber, parseCell, try{SYMBOLS[char]} where SYMBOLS = { '+': 'add', '(': "parens_open", ...}
    - think about how I would add the following: unary ops like '-1', "3!"; funcs like 'avg(a1, a2, a3)' and even a comma-based, alternative syntax for sum.

- add E2E test runner and write a basic UI test. Do this before rebuilding UI so You know what makes a UI testable.

- refactor: try to apply lessons from talk 'data oriented design'

    - Token type: remove position.end -- can be calculated from start and value.length

- off to Figma -> redesign UI

- Build basic UI for errors

- rebuild UI. start count 1 not 0.

- state: propagate changes

- write test for state updates

    -> introduce networking

**@BACKLOG**

## SECURITY

- Protect again numeric overflow. Look into [ decimal.js ](https://mikemcl.github.io/decimal.js/#). Then add tests:
    - "handles operations resulting in Infinity" // 1/0.0000001 repeatedly
        - remember: 0/0, 1/0, -1/0 == NaN, Infinity, -Infinity, respectively
    - "handles very large numbers" // potential overflow
- Escape user input

## FEAT

### UX/UI

- make it easier to read and input formulas
- highlight dependencies
- show errors

- think about how to make things easier on mobile: e.g. break up the input of a formula into steps: 1. select operation: =, -, \*, /, 2. select cells: enter a selecting mode where you can tap on cells or even drag over the cells to select a field of cells.

### IMPROVE

- animate only propagated changes, not the cell that was just edited
- stagger animations?
- parse: add functions "mult" | "avg" | "max" | "min" | "count"
- parse: add negation
    - add test: "handles negative numbers in calculations" // -5 \* -3
- parse: add nested functions

## ERRORS

- Big picture -- implement non-console error messaging

* Parse errors that the 'any' parser returns
  We want to be able to display a message to the user like these:
* SUM(12) → "Function arguments must be cell references"
* SUM(A1:) → "Expected cell after ':'"
* SUM(A1,) → "Expected cell after ','"

- Parsing: mb accumulate errors instead of failing fast for a different UX
- add error: [OUT_OF_BOUND] Number too big (applies to single nums as well as result of calc. should be checked after evaluating cell reference)
- THink about error boundaries
- what does this mean for the program?: a cell is in an error state
- put error types in arrays, get error type string from there
- Error types in parsing pipeline could probably be simplified
    - example: ast. we got a createError dispatcher that creates a message, we call that with structured expected/received data, and we have slightly different error type in the parser-combinators themselves. we could probably at least merge these into one less type. maybe even into a single one

## REFACTOR

- Rethink propagation. Simplify.

- Re-integrate 'interpret' into main parsing pipeline? see comments in parse/main.ts

## FIX

## TESTS

---

# DONE

[x] Add unit tests for RD parser
[x] Rewrite parser using recursive descent
[x] Hook new parser into existing app
