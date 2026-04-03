# Skill: MCP Server Patterns

Use this skill when:
- calling external tools or MCP servers
- combining lookup, search, fetch, or browser actions
- using tool chains

## Rule
Use tools as workflows, not isolated calls.

## Typical patterns
- resolve -> fetch -> refine
- search -> inspect -> summarize
- explore -> verify -> decide

## Guardrails
- prepare inputs before calling tools
- prefer authoritative data sources
- avoid unnecessary tool calls
- keep tool chains short and purposeful
- explicitly note uncertainty when tools conflict