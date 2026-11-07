// A small OpenSpec root as files, exercising every shape the views draw: two main specs, an
// active change with partial tasks and ADDED, MODIFIED and REMOVED deltas, a tooling change that
// skips specs, and an archived change.
import type { Files } from '../model/repo';

export const SAMPLE_FILES: Files = {
  'config.yaml': 'schema: spec-driven\n',
  'specs/user-auth/spec.md': `# user-auth Specification

## Purpose

Who a person is to the system, and how they prove it: sign-in, sessions and signing out.

## Requirements

### Requirement: Sign-in with email and password

The system SHALL let a person sign in with their email address and password, and SHALL reject a wrong password without saying which of the two was wrong.

#### Scenario: Correct credentials

- **WHEN** a person submits a registered email and its password
- **THEN** a session starts and the person lands on their home page

#### Scenario: Wrong password

- **WHEN** a person submits a registered email with the wrong password
- **THEN** the form shows "Email or password is incorrect"
- **AND** no session starts

### Requirement: Sessions expire

A session SHALL end after 30 days without activity.

#### Scenario: Long absence

- **GIVEN** a session untouched for 31 days
- **WHEN** the person returns
- **THEN** they are asked to sign in again
`,
  'specs/theme/spec.md': `# theme Specification

## Purpose

The look a person chooses for the app: light or dark, and whether it follows the system.

## Requirements

### Requirement: Theme choice

The app SHALL offer light and dark themes and SHALL remember the choice across sessions.

#### Scenario: Choosing dark

- **WHEN** a person picks dark in settings
- **THEN** every screen draws in the dark theme
- **AND** the choice is there on their next visit
`,
  'changes/follow-system-theme/proposal.md': `# Follow the system theme

## Why

People who switch their OS between light and dark through the day have to switch the app by hand too. Following the system removes a chore and matches what other apps do.

## What Changes

- Add a third theme option, **System**, that follows the OS setting live.
- Remember \`system\` like any other choice.
- **BREAKING** for nobody: light and dark stay as they are.

## Capabilities

### New Capabilities

- \`system-theme\`: following the operating system's light/dark setting.

### Modified Capabilities

- \`theme\`: the theme choice gains a third option.

## Impact

Settings screen, the theme store, and the CSS \`prefers-color-scheme\` listener.
`,
  'changes/follow-system-theme/design.md': `# Design

## Context

The theme is a store with two values. Screens read it through one scope.

## Decisions

- Listen to \`matchMedia('(prefers-color-scheme: dark)')\` once, at the scope, not per screen.
- The stored value is the *choice* (\`light\`, \`dark\`, \`system\`), never the resolved theme.

## Risks / Trade-offs

A flash of the wrong theme before the listener reports; mitigated by reading the media query synchronously at start.
`,
  'changes/follow-system-theme/tasks.md': `# Tasks

## 1. Store

- [x] 1.1 Add \`system\` to the theme choice
- [x] 1.2 Resolve the choice against the media query

## 2. Settings

- [ ] 2.1 Third option in the theme picker
- [ ] 2.2 Explain what System does, in one line

## 3. Verification

- [ ] 3.1 Story: switching the OS theme switches the app
`,
  'changes/follow-system-theme/specs/system-theme/spec.md': `# Spec Delta

## Purpose

Following the operating system's light or dark setting, live, so the app changes when the OS does.

## ADDED Requirements

### Requirement: Follow the OS

When the choice is System, the app SHALL draw in the OS's current theme and SHALL change when the OS does, without a reload.

#### Scenario: OS switches to dark

- **GIVEN** the choice is System and the OS is light
- **WHEN** the OS switches to dark
- **THEN** every open screen redraws in the dark theme within a second
`,
  'changes/follow-system-theme/specs/theme/spec.md': `# Spec Delta

## MODIFIED Requirements

### Requirement: Theme choice

The app SHALL offer light, dark and system themes and SHALL remember the choice across sessions.

#### Scenario: Choosing dark

- **WHEN** a person picks dark in settings
- **THEN** every screen draws in the dark theme
- **AND** the choice is there on their next visit

#### Scenario: Choosing system

- **WHEN** a person picks system in settings
- **THEN** the app draws in whatever the OS is set to

## REMOVED Requirements

### Requirement: Theme preview

**Reason**: Nobody used the preview tile; the live switch is its own preview.
`,
  'changes/ci-cache/proposal.md': `# Cache the install in CI

## Why

Every run reinstalls from scratch; a cache cuts three minutes.

## What Changes

- Cache \`node_modules\` keyed on the lockfile.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none)

## Impact

\`.github/workflows/checks.yml\` only.
`,
  'changes/ci-cache/.openspec.yaml': 'skip_specs: true\n',
  'changes/ci-cache/tasks.md': `# Tasks

- [x] Add the cache step
- [x] Verify a warm run is faster
`,
  'changes/archive/2026-10-30-session-expiry/proposal.md': `# Expire idle sessions

## Why

Sessions lived forever; shared machines kept people signed in.

## What Changes

- Sessions end after 30 days of inactivity.

## Capabilities

### Modified Capabilities

- \`user-auth\`: sessions expire.

## Impact

The session store.
`,
  'changes/archive/2026-10-30-session-expiry/tasks.md': `# Tasks

## 1. Store

- [x] 1.1 Record last activity
- [x] 1.2 Reject sessions past 30 days
`,
  'changes/archive/2026-10-30-session-expiry/specs/user-auth/spec.md': `# Spec Delta

## ADDED Requirements

### Requirement: Sessions expire

A session SHALL end after 30 days without activity.

#### Scenario: Long absence

- **GIVEN** a session untouched for 31 days
- **WHEN** the person returns
- **THEN** they are asked to sign in again
`,
};
