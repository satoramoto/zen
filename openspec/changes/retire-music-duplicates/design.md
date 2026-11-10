# Design

## Decisions

- **Expand `Music.Transport` rather than keep `TransportBar` as a `Playback` part it consumes.**
  The two drew the same five things; splitting them would leave two parts where one does, and the
  toolkit's transport would still need the new props to be driven from plain data.
- **A `MusicScope` node at the call site**, not a scope built into the meter. The scope is the
  toolkit's one vocabulary boundary; MixBand's wrapper is `display: contents`, so the meter is
  still the strip's child.
- **The host's `onUnit` hears changes only.** The position store reports the unit it restored on
  mount; the handler passes a unit on only when it differs from the one held, so a host is not
  called on mount unless a remembered unit was restored. With `unit` given, `remember` is unused
  and a press asks for the other unit.
- **No root aliases for the removed names.** `Music.Meter` needs a scope the old `Meter` did not,
  so an alias would draw unstyled.
