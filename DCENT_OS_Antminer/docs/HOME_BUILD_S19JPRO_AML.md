# Home build notes: Antminer S19j Pro, Amlogic control board (`am3-s19jpro-aml`)

Community notes from a home miner, kept on the `amlogic-s19jpro-home-build` branch of a fork.
Not an official D-Central document. Upstream discussion:
[DCentralTech/DCENT_OS#6](https://github.com/DCentralTech/DCENT_OS/issues/6) and
[DCentralTech/DCENT_OS#7](https://github.com/DCentralTech/DCENT_OS/issues/7).

> Status: the `dcentrald` daemon builds, and a lab (unsigned, dev) image for `am3-s19jpro-aml`
> builds with Buildroot on Ubuntu 24.04. Nothing has been flashed or run on real hardware from
> this branch. Upstream marks this target as not installable (`update_mechanism: none`). Flashing the wrong image can brick a control board. Test only on a
> spare control board with a recovery path.

## What this branch changes

1. **Restores 6 constant names the public mirror scrubbed** (and their uses) in
   `dcentrald-common` S19k files, so the public daemon compiles. The originals are unknown, so
   they are named `LOCAL_*` and each is marked with a comment. No S19j Pro code path uses them.
2. **Admits the public VNish 1.2.6 donor** for `am3-s19jpro-aml` only, in
   `br2_external_dcentos/board/amlogic/require-exact-build-inputs.sh`, pinned by its own fw-info
   digest. Kernel and DTB checks are unchanged. `scripts/build_in_docker.sh` reads it from a
   separate folder when `DCENT_AM3_S19JPRO_PUBLIC_DONOR=1`.

## The public donor matches the pinned kernel and DTB

The pinned donor is VNishFarm 1.2.6-rc5. The public package
`vnish-s19jpro-aml-nand-v1.2.6-install.tar.gz` from vnish.group (19,015,297 bytes, sha256
`32d3e5453b2c63ee71bbab051548ad15179f26ab8038a885ba41080ac6a18636`) contains:

| File | Size | SHA256 | vs pin |
|---|---|---|---|
| `vmlinux.bin` | 14,960,648 | `d5013ac9f545df3b0792ea2cd8902b51e323bbb6f73ff0fea17bbee9f6157fe6` | identical |
| `devicetree.dtb` | 20,945 | `540c1770543d9620e106ea4287c2a534f5efd85c912e97d6be6295930506b257` | identical |
| `etc/fw-info` (inside `uramdisk.image.gz`) | 299 | `2fe5f1330c4da9f7a0dde7d76376f08944b085fdaed0af9ae89bcb6301bbf30f` | label differs (`vnishgroup` / `1.2.6`) |

These files are **not** in this repo and must never be committed. Get the package yourself from
vnish.group, then lay the three files out as:

```
<inputs>/files/knowledge-base/extractions/vnish-group/s19jpro/vnish-1.2.6-aml-nand-install/
    vmlinux.bin
    devicetree.dtb
    rootfs/etc/fw-info
```

`uramdisk.image.gz` is a 64-byte u-boot header followed by a gzip'd newc cpio; `etc/fw-info` is
one member of it.

Check the inputs on their own:

```sh
. br2_external_dcentos/board/amlogic/require-exact-build-inputs.sh
export DCENT_AM3_AML_KERNEL=.../vmlinux.bin
export DCENT_AM3_AML_DTB=.../devicetree.dtb
export DCENT_AM3_AML_FW_INFO=.../rootfs/etc/fw-info
dcent_require_exact_amlogic_build_inputs am3-s19jpro-aml
```

## Building the daemon on Windows

Tested on Windows 11 with the repo-pinned Rust 1.90.0.

1. `rustup target add aarch64-unknown-linux-musl`
2. Get **Zig 0.13.0** for Windows from ziglang.org (`zig-windows-x86_64-0.13.0.zip`, sha256
   `d859994725ef9402381e557c60bb57497215682e355204d754ee3df75ee3c158`). `ring` needs it as the
   C cross-compiler.
3. Point the repo's `dcentrald/zig-cc-aarch64.py` and `zig-ar-aarch64.bat` at your Zig (they
   hardcode another path), or use copies that do.
4. Build from **PowerShell, not Git Bash**. Git Bash puts coreutils `link` ahead of MSVC
   `link.exe`, which breaks host build scripts.

```powershell
cd DCENT_OS_Antminer\dcentrald
$env:CC_aarch64_unknown_linux_musl = "<path>\zig-cc-aarch64.bat"
$env:AR_aarch64_unknown_linux_musl = "<path>\zig-ar-aarch64.bat"
cargo build --release --target aarch64-unknown-linux-musl
```

Result: a static aarch64 ELF at `target/aarch64-unknown-linux-musl/release/dcentrald` (about
16.7 MB), plus `dcentos-init` and `dcentos-discovery`. A cold release build took about 15 minutes.

## Building a lab image (Ubuntu 24.04, no Docker)

This skips the release capsule (`scripts/build_in_docker.sh`), which needs D-Central's signing key
and the full private input bundle. This branch also restores the exec bits and the
`board_runtime_policy.json` file the public mirror is missing.

1. Build `dcentrald` for `aarch64-unknown-linux-musl` (above) and copy `dcentrald`,
   `dcentos-init` and `dcentos-discovery` into
   `DCENT_OS_Antminer/dcentrald/target/aarch64-unknown-linux-musl/release/` on the Linux host.
   `post-build.sh` installs them from there, so the host needs no Rust.
2. Fetch Buildroot at the pinned commit `7c8edc1b402efcd7bba2dabfe0b3be877adaed7a` into
   `DCENT_OS_Antminer/buildroot`.
3. Toolchain: Linaro's own URL now returns an HTML page. Buildroot's source mirror still has
   `https://sources.buildroot.net/toolchain-external-linaro-aarch64/gcc-linaro-7.2.1-2017.11-x86_64_aarch64-linux-gnu.tar.xz`
   (118,688,500 bytes, sha256 `20181f828e1075f1a493947ff91e82dd578ce9f8638fbdfc39e24b62857d8f8d`, which is
   `TOOLCHAIN_SHA256_AARCH64` in `build_in_docker.sh`). Put it in `buildroot/dl/toolchain-external-custom/`.
4. Configure:
   ```sh
   cd DCENT_OS_Antminer
   make setup DEFCONFIG=dcentos_am3_s19jpro_aml_defconfig \
     DEFCONFIG_FRAGMENTS="dcentos-common.fragment dcentos_am3_aml_common.fragment"
   ```
5. A dev image ships the defconfig's published root password. Change
   `BR2_TARGET_GENERIC_ROOT_PASSWD` in `buildroot/.config` to your own value first.
6. Build:
   ```sh
   export TARGET=am3-s19jpro-aml \
     DCENT_AM3_AML_KERNEL=<donor>/vmlinux.bin \
     DCENT_AM3_AML_DTB=<donor>/devicetree.dtb \
     DCENT_AM3_AML_FW_INFO=<donor>/rootfs/etc/fw-info \
     DCENT_PACKAGE_STATUS=lab_unsigned DCENT_ALLOW_UNSIGNED_SYSUPGRADE=1 DCENT_DEV_IMAGE=1
   make -C buildroot BR2_EXTERNAL=$PWD/br2_external_dcentos -j$(nproc)
   ```
   About 35 minutes on a 4-core i5-2400. Output in `buildroot/output/images/`: `kernel` (raw
   ARM64 Image), `uImage_rootfs.bin` (u-boot ramdisk), and the unsigned
   `dcentos-sysupgrade-am3-s19jpro-aml.tar`.

## Still missing

- `scripts/build_inputs.manifest` in the public mirror has hash-only lines (no paths), so the
  release capsule can't run. See #6.
- No install path for Amlogic boards, upstream either: `post-image.sh` sets
  `DCENT_PACKAGE_INSTALLABLE=false`. The safest first test is a RAM-only boot from u-boot over the
  serial console on a spare control board, with no NAND writes.
