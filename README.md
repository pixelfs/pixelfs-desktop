<p style="" align="center">
  <img src="./build/appicon.png" alt="Logo" width="192" height="192">
</p>

# pixelfs

[![GitHub License](https://img.shields.io/github/license/pixelfs/pixelfs-desktop?style=for-the-badge)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/pixelfs/pixelfs-desktop?display_name=tag&style=for-the-badge)](https://github.com/pixelfs/pixelfs-desktop/releases)

`PixelFS` is a cross-device file management system that simplifies file transfer and management across multiple devices using the `s3-protocol`.

## Installation

Available to download for free from <https://github.com/pixelfs/pixelfs-desktop/releases>

![](./screenshots/dark_1.png)
![](./screenshots/light_1.png)

<details>
<summary>More Screenshots</summary>

![](./screenshots/dark_2.png)
![](./screenshots/light_3.png)
![](./screenshots/dark_4.png)
![](./screenshots/light_4.png)
![](./screenshots/dark_6.png)
![](./screenshots/dark_7.png)
</details>

## Build Guidelines

### Prerequisites

- Go (latest version)
- Node.js >= 20
- PNPM >= 9

### Install Wails

```bash
go install github.com/wailsapp/wails/v3/cmd/wails3@latest
```

### Pull the Code

```bash
git clone https://github.com/pixelfs/pixelfs-desktop.git
```

### Compile and Run

```bash
wails3 dev
```
