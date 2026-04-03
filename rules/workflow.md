# Development Workflow

## Before coding
1. understand the task
2. inspect existing implementation patterns
3. search codebase for related files and symbols
4. if framework/library behavior matters, check docs
5. define the smallest acceptable change

## During coding
- prefer local consistency over idealized rewrites
- keep function size and nesting under control
- leave code easier to understand than before

## Before finishing
- run relevant tests
- run lint/typecheck when relevant
- check for regressions in adjacent flows
- summarize what changed and what remains uncertain