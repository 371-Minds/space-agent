# AGENTS

## Purpose

`packaging/platforms/` holds platform-specific packaging files.

## Structure

- `packaging/platforms/macos/`: macOS packaging assets and metadata
- `packaging/platforms/windows/`: Windows packaging assets and metadata
- `packaging/platforms/linux/`: Linux packaging assets and metadata

## Guidance

- keep platform-neutral host logic out of these folders
- store only packaging-specific assets, metadata, and overrides here
