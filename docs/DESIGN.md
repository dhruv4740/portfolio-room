# Design — "Technical Instrument"

The rules exist because "make it impressive" with no constraints converges on
the same gradient-and-glassmorphism page every AI generates. Constraint is what
makes it look authored.

All values live in `src/v3/tokens.css`. Nothing hardcodes a colour or duration.

## Palette

```
--void       #0A0A0B    background
--void-lift  #131316    raised surfaces
--bone       #E8E4DC    primary text (not white — white is a screenshot, bone is a print)
--dim        #6B6B72    secondary text
--faint      #2A2A2F    hairlines
--signal     #FF5F1F    the accent. Exactly one.
```

**There is no `--gradient-*` token, deliberately.** If you need emphasis, use
`--signal` or hierarchy — not a gradient.

`--signal` marks one thing per view. If two things are orange, neither is.

## Type

`Space Grotesk` for display, `JetBrains Mono` for data. Mono is not decorative:
readouts, telemetry, labels and coordinates are mono because they are *data*.
Prose is not.

## Motion

Three durations, one curve. `--ease: cubic-bezier(0.22, 1, 0.36, 1)`.

```
--d-feedback    150ms   hover, focus, press
--d-transition  400ms   panels, state changes
--d-reveal      900ms   entrances, camera moves
```

If a new interaction needs a fourth duration, it probably needs a rethink
instead.

`prefers-reduced-motion` is honoured: camera flights teleport rather than
animate. Handled in `cameraRig.js`.

## Chrome

The scan surface is framed like an instrument reading a sample: masthead
top-left, nav top-right, telemetry bottom-left, hint bottom-right. Telemetry
renders `—` for unknown values rather than `0`, because a fake zero is a lie an
instrument wouldn't tell.
