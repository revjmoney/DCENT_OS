# Home build notes: Antminer S19j Pro, Amlogic control board (`am3-s19jpro-aml`)

Community notes from a home miner, kept on the `amlogic-s19jpro-home-build` branch of a fork.
Not an official D-Central document. Upstream discussion:
[DCentralTech/DCENT_OS#6](https://github.com/DCentralTech/DCENT_OS/issues/6) and
[DCentralTech/DCENT_OS#7](https://github.com/DCentralTech/DCENT_OS/issues/7).

> Status: the `dcentrald` daemon builds. No image has been built, flashed, or run on real
> hardware from this branch. Flashing the wrong image can brick a control board. Test only on a
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

## Still missing for a full image

- `scripts/build_inputs.manifest` in the public mirror has hash-only lines (no paths), so
  `scripts/source_closure.py` stops at line 78. See #6.
- Linaro GCC 7.2.1-2017.11 **aarch64** toolchain: upstream URL is dead. It is GPL; any copy is
  usable if its sha256 matches a manifest line.
- Buildroot needs a Linux host.
- No documented install path for Amlogic boards yet (`docs/INSTALL` covers S9 and S19j Pro Xilinx).
