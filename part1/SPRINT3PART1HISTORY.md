# What I did in Sprint 3, Part 1

The steps I need to take to learn and achieve the given tasks...

## Getting Started

- copied /part4 of sprint 2 which holds the notes app as used in sprint review
- renamed it to /part1 and tried npm run dev. It worked without further installations needed
- Intstalled Claude CLI, upgraded to pro and logged into Claude Code via terminal (I'm on a new laptop on the old one I was using claude API)
- Made GitHub repository and walked through steps to have currents state pushed
- Fixed folder path of GitHub Commit to /sprint3/part1, ist was only /part1 before

## Creating a Subagent

- 1 opened /agent
- 2 selected library and personal as destination
- 3 gave prompt provided in TC material
- 4 selected read only
- 5 selected Sonnet
- 6 selected pink
- 7 selected user scope
- 8 saved and tested with given prompt

## Installing Superpowers

- ran /plugin install superpowers@claude-plugins-official
- ran /reload-plugins
- ran /skills, superpowers are loked an "on"

## Lab: 2 Virtual Employees

- Created .claude/agents/ai-architect.md
- Created .claude/agents/ai-code-reviewer.md
- Created .claude/agents/ai-researcher.md
- tried it, but we already had the dark mode toggle built in sprint2

## Exercise:

- PartA: ran audit
-- had large notes-...tsx refactored as suggested, let Claude do it's thing in auto mode
-- commited and pushed refactoring
-- fixed 4 more leftover review findings
-- commited and pushed 4 review findings
- PartB: build third subagent
-- created skill.md
-- created the subagent
-- did /reload-plugins and ran the audit
-- fixed 2 issues
-- ran audit again