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
* [Youtube tutorial](https://www.youtube.com/watch?v=SauvYKQGzXE)
* [Slightly hidden Xstate docs](https://graph-docs.vercel.app/model-based-testing/intro)

## Going Further
* Alternatives to State Machines?: [sum types and discriminated unions](https://www.google.com/search?q=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&sca_esv=61c64a259e7d732d&hl=en&sxsrf=AHTn8zrTu46-V4JABk7UKLuK4GUoZGqhOg%3A1738328579715&ei=A8qcZ5WsK-K2i-gPsPGM8AE&ved=0ahUKEwjVufzLgqCLAxVi2wIHHbA4Ax4Q4dUDCBE&uact=5&oq=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&gs_lp=Egxnd3Mtd2l6LXNlcnAiQHN0YXRlIG1hY2hpbmUgYWx0ZXJuYXRpdmVzICdzdW0gdHlwZXMnIE9SICdkaXNjcmltaW5hdGVkIHVuaW9ucydIuHBQwgZYk2xwBHgBkAEAmAGfAaAB2hqqAQQ4LjI1uAEDyAEA-AEBmAIZoAKwFcICChAAGLADGNYEGEfCAgUQIRigAcICBxAhGKABGArCAgQQIRgVwgIIEAAYgAQYogTCAgUQABjvBZgDAIgGAZAGCJIHBDIuMjOgB89d&sclient=gws-wiz-serp)
* Simplify working with immutable states: [Immer](https://immerjs.github.io/immer/)

## Related Projects
* [Tic-Tac-Toe](https://github.com/statelyai/xstate/blob/main/examples/tic-tac-toe-react/src/ticTacToeMachine.ts)
* [Tiles](https://github.com/statelyai/xstate/blob/main/examples/tiles/src/tilesMachine.ts)

---

# TODO

[x] Cell type: differentiate between content (which could be a formula) and value (which is what it displays when in a non-focused state)
[x] token can be a cell name

[x] Update cells that have been mentioned in a formula
[x] rethink: say a cell depends on A0 and A1 but then you change it so it only depends on A0 --> you have to update A1. Maybe reframe this problem so it solves propagation as well :)

[x] Check propagation
[x] rethink: the propagation algorithm. write it down, high-level. what about errors? can you reuse solveFormula?

## FEAT

### Formula parsing

-   Add addition of cell ranges: SUM(A1:B3)
-   Add multiplication
-   Add other operations
-   Add recursivity (properly process parentheses)

### UX/UI

-   cell expands when focused: easier to read content
-   edgecase: it's a formula but it's just a single referenced cell that contains string. So: A0='foo', A1='=A0'
-   highlight dependencies; errors
    [x] animate propagated changes
-   animate errors differently

-   think about how to make things easier on mobile: e.g. break up the input of a formula into steps: 1. select operation: =, -, \*, /, 2. select cells: enter a selecting mode where you can tap on cells or even drag over the cells to select a field of cells.

### IMPROVE

-   animate only propagated changes, not the cell that was just edited

## ERRORS

-   Big picture -- implement non-console error messaging
-   only keep 1 error/newest error per cell (?)
-   mb ignore empty cells in formula instead of throwing, mb treat them as 0
-   log cell name instead of raw index in error message 'we got a problem in cell 123'

## REFACTOR

-   make Cell.cellsThatDependOnMe a Set
-   think about making propagation declarative instead of mutating (is that possible? desirable? use a return value?)

## FIX

[x] newly added values crash the app
---- [x] Make accessing the cells array more robust: add optional chaining; initialize with empty Cell instead of undefined

## TESTS

-   Add tests. See resources

