# Skill: Eval Harness

Use this skill when:
- adding a major feature
- changing prompts or agent behavior
- fixing bugs that may regress
- comparing model or workflow variants

## Eval types
### Capability eval
Checks whether the new system can do something it could not do before.

### Regression eval
Checks whether existing behavior still works.

## Graders
- code-based grader: deterministic checks
- model-based grader: quality judgment
- human grader: high-risk or ambiguous cases

## Metrics
- pass@k: succeeds at least once within k attempts
- pass^k: succeeds every time for k attempts

## Minimal output
For each important change, define:
- capability evals
- regression evals
- success criteria
- verification method