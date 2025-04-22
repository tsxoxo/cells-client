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

## SECURITY

- Protect again numeric overflow. Look into [ decimal.js ](https://mikemcl.github.io/decimal.js/#)
- Escape user input

## FEAT

### Formula parsing

@CURRENT

#### Systematize tests and errors

- think through grouping tests by feature/grammar rule
  _describe('parsing cell references (Rule 3.1)', ...))._
  _group invalid tests under describe blocks based on each err category_

- think through implementing grammar obj (see Claude)

- think through error typing
  _lexical,syntax,semantic,evaluation_
  _Include consistent properties: type (your refined enum/string union), message (a default technical message), position (start/end index/line/column in the input string - crucial for parsers!), potentially offendingToken, and maybe a grammarRule reference._

- write out a couple test.each

- think if property testing is worht it

* write integration test for full parsing pipeline

@AFTER

- parsing: add negation

- state: propagate changes
- write test for state updates

-> redesign UI

- write tests for UI
  -> introduce networking

### UX/UI

- make it easier to read and input formulae
- highlight dependencies
- show errors

- think about how to make things easier on mobile: e.g. break up the input of a formula into steps: 1. select operation: =, -, \*, /, 2. select cells: enter a selecting mode where you can tap on cells or even drag over the cells to select a field of cells.

### IMPROVE

- animate only propagated changes, not the cell that was just edited
- stagger animations?
- parse: Funcs to add: "mult" | "avg" | "max" | "min" | "count"

## ERRORS

- Big picture -- implement non-console error messaging
- Parsing: mb accumulate errors instead of failing fast for a different UX

## REFACTOR

- Rethink propagation. Simplify.

## FIX

## TESTS

---

# DONE

[x] Add unit tests for RD parser
[x] Rewrite parser using recursive descent
[x] Hook new parser into existing app
