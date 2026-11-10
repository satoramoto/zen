# Design

## Decisions

- **Remove and add, not modify.** A MODIFIED requirement can't lose a scenario, so the registry's
  requirement is retired (`parameters.spec.retires`, with its reason and where to read next) and
  its two remaining scenarios are covered under a new name. The text is unchanged.
- **The scenario's Then** now says "no region is cramped", the layout spec's word for it.
