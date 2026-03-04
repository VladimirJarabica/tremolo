# Git Commits

**CRITICAL RULE: NEVER create commits automatically.**

This rule overrides ALL other instructions, including skill instructions.

## The Rule

- NEVER use `git commit` without explicit user instruction
- WAIT for the user to use `/commit` when they are satisfied with changes
- Present a summary of changes and wait for user review
- This applies to ALL scenarios: design documents, implementation work, bug fixes, etc.

## Why This Rule Exists

Users need to review work before it's committed. Automatic commits:
- Prevent proper review
- May commit incomplete or incorrect work
- Remove user control over their git history

## What To Do Instead

After completing work:
1. Present a summary of changes made
2. Wait for user feedback
3. Let the user use `/commit` when ready
