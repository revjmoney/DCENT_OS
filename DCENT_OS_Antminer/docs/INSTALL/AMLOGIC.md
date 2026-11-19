# S19 and S21 families with Amlogic controllers

> Fork placeholder. D-Central's `INSTALL/AMLOGIC.md` is not included in the public mirror
> (see [DCentralTech/DCENT_OS#6](https://github.com/DCentralTech/DCENT_OS/issues/6)). The
> dashboard's Help page imports this file, so the build needs it to exist.

## What is known for the S19j Pro Amlogic target (`am3-s19jpro-aml`)

- An image for this target builds; see the [home build notes](../HOME_BUILD_S19JPRO_AML.md).
- There is **no install route** for it yet, upstream included. Its packaging step marks the
  package not installable, and the board runtime policy lists `update_mechanism: none`.
- Do not write any image to the NAND of an Amlogic control board without a tested recovery
  path. The safest experiment is a RAM-only boot from u-boot over the serial console on a
  spare control board, with no NAND writes.

For other Amlogic models, check the upstream project for supported packages and procedures.
