TODO:

[x] Cell type: differentiate between content (which could be a formula) and value (which is what it displays when in a non-focused state)
[x] token can be a cell name

-   Update cells that have been mentioned in a formula
-   Check propagation
-   rethink: say a cell depends on A0 and A1 but then you change it so it only depends on A0 --> you have to update A1
-   rethink: the propagation algorithm. write it down, high-level. what about errors? can you reuse solveFormula?

-   Add addition of cell ranges: SUM(A1:B3)
-   Add multiplication
-   Add other operations
-   Add recursivity (properly process parentheses)
-   dragging
-   cell expands when focused: easier to read content
-   edgecase: it's a formula but it's just a single referenced cell that contains string. So: A0='foo', A1='=A0'
-   UI: highlight dependencies
-   UI: animate propagated changes
