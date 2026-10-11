# Coordinator browser evidence — V2
Validated through CUA-controlled background in-app browser, not source-only testing.
V2 changes: T2 min16ch (was28); W3 min160px (was260); G1 caption now names appearance of column guide on wider screens.

At actual iframe document viewport320px, all6 chapters have scrollWidth320, and no visible chapter descendant extends beyond321px. All14 comparison toggles exercised via Space, with computed visual changes confirmed:
T1 title34px/15px; T3 row alignment start/center; G1 padding0/28px; G2 columns167.266+83.637 vs125.451+125.451; G3 gap16/31px; C1 surroundrgb40,45,52 vs189,189,189; C2 light/dark surface; R1 weight400/700; R2 padding16/11px; R3 label gap6/16px; W2 sans/serif navigation; B1 line-height22.95/17.85px; B2 weight400/700; B3 polished none/block.
Other4: T2 measured width166.884px at min16ch vs262.899px max76ch; C3 hue0 vs240 gives rgb192,89,89 vs89,89,192; W1 technical selection computes ui-monospace; W3 preview160px vs296.007px at requested640, thus both min/max differ on narrow screens.
Screenshots inspected for actual rendered content including narrow W1/W2; no clipping observed. All18 also exercised at wider desktop (~769CSSpx iframe), each computed visual effect confirmed.
No claim independent agents used browser; this is coordinator's supplied runtime evidence. Both agents independently inspect source and references.
