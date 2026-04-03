# Skill: Documentation Lookup

Use this skill when:
- the task depends on framework/library/API behavior
- version-specific behavior matters
- generating code for a named library

## Rule
Do not rely only on model memory for current library behavior.

## Workflow
1. identify the exact library/framework/package
2. resolve the correct documentation target
3. query official or primary docs
4. prefer version-specific docs when available
5. summarize findings with uncertainty if needed

## Guardrails
- prefer official docs over third-party summaries
- limit repeated lookups
- never send secrets in queries