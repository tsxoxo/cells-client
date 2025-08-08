# Cells

7th task of the [7 GUIs](https://eugenkiss.github.io/7guis/tasks/#cells).

Made with [Vue](https://vuejs.org/) and [Xstate](https://stately.ai/docs) -- a
framework for using finite state machines (FSM).

---

[Live version](https://tsxoxo.github.io/cells-client)

[Diagram of FSM in Stately
Studio](https://stately.ai/registry/editor/6782ed10-3960-405b-8d20-47a05f5bb92c?machineId=b0690012-5357-4cf2-b293-6e096d531e5c)

[![Open in
StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/tsxoxo/cells-client)

---

## Design Pillars

My overall goal with this project is to build a production-quality
web-application from start to finish -- meaning doing everything from designing
the UI to deploying.  

### User Experience First

The app communicates its state clearly to users.
This implies that the dev should also know what is going on — a finite state machine helps with that.

The core applications of this pillar can be summarized as follows.

*Use these visual feedback systems to communicate application state transparently:*

* Display helpful granular errors when user makes a mistake in a formula
* Highlight erroneous cell(s) and the affected token in the formula
* Indicate I/O states such as network submitting, server-timeout

### Robustness

The app is built to be reliable through systematic approaches to testing, validation, and error handling.

This pillar influences architectural decisions across the system:

* Comprehensive testing strategy: example-based, property-based (using fuzzing), E2E, FSM testing
* Schema validation for API contracts
* Error transformation pipeline to decouple parsing logic from UI concerns
* Finite state machine for predictable application behavior

## Key Architectural Decisions

### Build a Vertical Slice First

_2025-07-11_

This was a big lesson for me. I've been running into this again and again: Having an MVP would have clarified modelling problems immensely.

By which I mean having a working version of the program with all the systems
integrated: a whole 'vertical slice'. In this case this would have meant having
something like: a minimal parser, a minimal ui, a minimal deployment. As it is,
I am modelling stuff in the abstract.

Here's what happened: I started an ambitious refactor of my recursive descent parser into parser combinators, which was going well functionally. But I kept hitting integration questions: How should parser errors work with the UI? With the backend? I have fiddled with my error types, 'thinking ahead' to how they are
going to be displayed in the UI. I could have saved myself a lot of time if I
actually had a UI to test these theories.

Rather than solve these abstractly, I pivoted to build a complete vertical slice first. This revealed that system integration decisions should inform component design, not the other way around.

This pattern kept repeating: I'd start with ambitious technical solutions (parser combinators, comprehensive error types) then hit integration walls. I realized I was optimizing components in isolation instead of understanding the system first. Now I **start with the messiest possible working version** - even if the code is terrible - just to see how the pieces actually fit together. Then I can refactor intelligently.

(I heard this advice somewhere and it's been living in my head for free since
then.)

### Error Transformation Pipeline

Designed separate error types for parser internals vs UI contracts to maintain clear boundaries between system layers. ParseError contains technical parsing details, while UIError focuses on what users need: cell highlighting, token positions, and human-readable messages.

### Schema-First API Design

Chose schema-first approach with Zod for request validation to catch contract mismatches early and maintain type safety across frontend/backend boundaries.

### Property-Based Testing Strategy

Started with scattered test data across multiple files. Implemented structured regression testing with `it.each`, then discovered property-based testing. Used fuzzing to generate arithmetic formulas and systematically explore parser edge cases that example-based tests missed. Total: 70+ test cases covering both structured examples and generated boundary conditions.

## Personal Goals

I wanted to learn several interlocking things with this: 

* Explore testing: property-based tests, E2E tests and structured example-based tests
* Explore the full stack and deal with a database, networking and deployment

## Additional Lessons

### Don't Let Testing Drive Data Design

Making function parameters optional just to simplify testing seems backwards.
The question is: How are the functions actually being used in the program.
Testing should not dictate the domain model.

### Nesting Sucks

I like the factory pattern but I don't like huge objects and debugging syntax
errors in nested objects. So I landed on this pattern as a compromise. It
breaks things apart, which does make me jump around more and hurts the
aesthetics, but this is still better than searching for a mismatched bracket in
a 4-level nested object, even with currying (see utils/cells.ts). Maybe there's
tooling to help with that?

```ts function foo(){} function bar(){}

export mainAPI = { foo, bar } ```

---

## Resources

### FSM Testing

- [Write and Test State-Machines with XState and Vitest (video)](https://www.youtube.com/watch?v=SauvYKQGzXE)
- [Model-based testing (slightly hidden Xstate docs)](https://graph-docs.vercel.app/model-based-testing/intro)

### Going Further

- Alternatives to State Machines?: [sum types and discriminated
unions](https://www.google.com/search?q=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&sca_esv=61c64a259e7d732d&hl=en&sxsrf=AHTn8zrTu46-V4JABk7UKLuK4GUoZGqhOg%3A1738328579715&ei=A8qcZ5WsK-K2i-gPsPGM8AE&ved=0ahUKEwjVufzLgqCLAxVi2wIHHbA4Ax4Q4dUDCBE&uact=5&oq=state+machine+alternatives+%27sum+types%27+OR+%27discriminated+unions%27&gs_lp=Egxnd3Mtd2l6LXNlcnAiQHN0YXRlIG1hY2hpbmUgYWx0ZXJuYXRpdmVzICdzdW0gdHlwZXMnIE9SICdkaXNjcmltaW5hdGVkIHVuaW9ucydIuHBQwgZYk2xwBHgBkAEAmAGfAaAB2hqqAQQ4LjI1uAEDyAEA-AEBmAIZoAKwFcICChAAGLADGNYEGEfCAgUQIRigAcICBxAhGKABGArCAgQQIRgVwgIIEAAYgAQYogTCAgUQABjvBZgDAIgGAZAGCJIHBDIuMjOgB89d&sclient=gws-wiz-serp)
- Simplify working with immutable states:
[Immer](https://immerjs.github.io/immer/)

### Related Projects

- [Tic-Tac-Toe](https://github.com/statelyai/xstate/blob/main/examples/tic-tac-toe-react/src/ticTacToeMachine.ts)
- [Tiles](https://github.com/statelyai/xstate/blob/main/examples/tiles/src/tilesMachine.ts)

