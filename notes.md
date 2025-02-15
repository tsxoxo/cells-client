TODO:

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

-   Add tests. Slightly hidden resource: https://graph-docs.vercel.app/model-based-testing/intro
