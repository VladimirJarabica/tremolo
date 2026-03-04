---
description: Rebase onto main and consolidate commits into atomic units
allowed-tools: Bash(git fetch:*), Bash(git log:*), Bash(git rebase:*), Bash(GIT_SEQUENCE_EDITOR=: git rebase:*)
---

# Commit Cleanup

Rebase the current branch onto main and consolidate commits into clean, atomic units.

## Steps

1. Fetch and rebase onto `origin/main`
2. Review commit history with `git log --oneline origin/main..HEAD`
3. Identify commits that should be squashed together (related changes, fixups, WIP commits)
4. Interactive rebase to consolidate: `GIT_SEQUENCE_EDITOR="sed -i '' 's/pick/squash/g; 1s/squash/pick/'" git rebase -i origin/main`
5. Write clear commit messages for each consolidated commit using conventional format

## Commit Guidelines

- Each commit should be a single logical change
- Use conventional commit format: `type(scope): summary`
- Keep summary under 50 characters
- Add body explaining what and why (not how)
