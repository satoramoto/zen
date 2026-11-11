# Spec Delta

## Purpose

How an app outside zen builds view-tree parts the zen way: registering its own parts and stores with zen's runtime in both renderers, and running zen's rule checks on its own folders.

## ADDED Requirements

### Requirement: An app registers its own parts by name

An app SHALL be able to register its own view-tree parts with zen's runtime, once for each renderer, so that a model's `component` node naming one is drawn by that part; a name zen already has SHALL be refused.

#### Scenario: An app's part in a zen tree
- **WHEN** an app registers a part named `AppGauge` for React and for Svelte and a tree names it
- **THEN** each renderer draws the app's part in its place

#### Scenario: A taken name
- **WHEN** an app registers a part named `Button`
- **THEN** the registration is refused with a message naming the part zen already has

### Requirement: An app registers its own stores by name

An app SHALL be able to register a store by name, and a tree that binds that name SHALL apply the store in both renderers.

#### Scenario: A store bound in both renderers
- **WHEN** an app registers a store `appHold` and a tree binds it to an element
- **THEN** the store is applied to that element in React and in Svelte, and removed when it unmounts

### Requirement: The rule checks run on any folder

zen's contract check, tier rules and bindings-only rule SHALL each be callable on a folder an app names, returning what breaks the rule with its file and line.

#### Scenario: A literal colour in an app's part
- **WHEN** an app's stylesheet has a literal colour and the contract check is run on its folder
- **THEN** the check reports that file and line

#### Scenario: A clean folder
- **WHEN** the three checks are run on a folder that keeps zen's rules
- **THEN** each reports nothing
