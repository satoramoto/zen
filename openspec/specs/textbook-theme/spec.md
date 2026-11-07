# textbook-theme Specification

## Purpose
Two theme packs for the interactive textbook, a dark research console and a light industrial blueprint, with both modes each, and a reading face every pack supplies for long-form text.

## Requirements

### Requirement: Two textbook packs

The library SHALL offer a `textbook-console` pack, dark first, and a `textbook-blueprint` pack, light first, each with a light and a dark mode, each naming its Refero style and the source rules it keeps, and each passing the library's colour rules (ink on every solid fill at WCAG AA, every meaning-bearing colour distinct).

#### Scenario: Both packs in the Storybook toolbar

- **WHEN** the Theme toolbar is opened
- **THEN** both packs are listed, and choosing either redraws every story in it

#### Scenario: The colour rules

- **WHEN** the library tests run
- **THEN** both packs pass the contrast and distinctness checks in both modes

### Requirement: A reading face

The contract SHALL carry a `reading` face, emitted as `--font-reading`, which a pack may set for long-form body text and which falls back to the pack's sans when unset.

#### Scenario: A pack without a reading face

- **WHEN** a pack that sets no reading face is applied
- **THEN** `--font-reading` equals that pack's sans

#### Scenario: The blueprint pack

- **WHEN** the blueprint pack is applied
- **THEN** `--font-reading` is a text serif, and the display and labels are its grotesque
