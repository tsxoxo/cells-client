TODO:

[x] Cell type: differentiate between content (which could be a formula) and value (which is what it displays when in a non-focused state)
[x] token can be a cell name

-   Update cells that have been mentioned in a formula
-   Check propagation
-   Add addition of cell ranges: SUM(A1:B3)
-   Add multiplication
-   Add other operations
-   Add recursivity (properly process parentheses)
-   dragging
-   cell expands when focused: easier to read content
-   edgecase: it's a formula but it's just a single referenced cell that contains string. So: A0='foo', A1='=A0'
