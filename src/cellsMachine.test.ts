// CRUD a: User inputs string into empty cell => the correct <Cell> is updated in context and displayed on screen
// CRUD b: User deletes content of cell => <Cell> is correctly updated and '' is displayed
// CRUD c: User updates cell => updates happen in context and page 



// Formula recognition
// With primitives: User enters '=3+4' => display shows 7
// With errors: User enters '=3+foo' => display shows '=3+foo'
// With cell references
//// That are clean: User enters '=A0+A1' => the cells contain numbers, display shows result
//// That are dirty: User enters '=A0+A1' => one cell contains a string, display shows input

// Propagation
// 2 levels: User updates cell A. Cell B gets updated because of A. Cell C gets updated because of B 

// Animation?

// Model this with more states?