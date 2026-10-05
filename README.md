# Pawmodoro

A cozy fox pomodoro timer for Mac and Windows, with a floating mini timer and a focus heatmap.

## Get the installers (easiest: let GitHub build them)

You don't need to install any developer tools for this.

1. Create a new **private** repository on GitHub, e.g. `pawmodoro`.
2. Upload everything in this folder to it, including the hidden `.github` folder.
   - Easiest way: on the repo page, click **Add file → Upload files** and drag the folder contents in.
   - If the `.github` folder doesn't get uploaded, create the file `.github/workflows/build.yml` by hand
     (**Add file → Create new file**, type that path as the name) and paste in its contents.
3. Open the **Actions** tab. A "Build Pawmodoro" run starts on its own (or click **Run workflow**).
4. When it finishes (about 5–10 minutes), open the run and download:
   - `Pawmodoro-macOS` → contains the `.dmg` for your Mac
   - `Pawmodoro-Windows` → contains the `.exe` installer for your office PC

## Installing

**Mac:** open the `.dmg` and drag Pawmodoro into Applications. Because the app isn't signed with a paid
Apple developer certificate, macOS will block it the first time. Fix it once with either:
- right-click Pawmodoro in Applications → **Open** → **Open**, or
- in Terminal: `xattr -cr /Applications/Pawmodoro.app`

**Windows:** run the `.exe`. If SmartScreen says "Windows protected your PC", click **More info → Run anyway**.
It installs just for your user account, so it doesn't need admin rights. Some company PCs block unsigned
apps entirely; if yours does, IT has the final say.

## Using it

- **Mini timer** button: opens a small see-through pill that floats on top of every window.
  - Drag it anywhere. It remembers where you left it.
  - Hover over it to show play/pause and close.
  - **Settings → Mini timer size** and **Mini timer background** change its size and how see-through it is.
- **Space** starts and pauses the timer when the main window is focused.
- The timer keeps exact time even when the main window is minimized. Closing the main window quits the app.

## One heatmap for both computers

The app can combine your sessions from both computers through any cloud folder you already have:

1. On each computer, open **Settings → Sync folder → Choose folder**.
2. Pick the **same** folder inside a cloud drive both computers can see (OneDrive, Google Drive, Dropbox or iCloud Drive).
3. Each computer writes its own small file there (`pawmodoro-<id>.json`), so they never overwrite each other.
   The heatmap adds them together and refreshes every 30 seconds and whenever you switch back to the app.

Without a sync folder, each computer keeps its own heatmap.

## Building on your own computer (optional)

Needs [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm start          # run the app
npm run dist:mac   # build the .dmg (on a Mac)
npm run dist:win   # build the .exe (on Windows)
```

Installers end up in `dist/`.
