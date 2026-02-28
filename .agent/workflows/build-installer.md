---
description: How to build and distribute the Ravino Kashrut application
---

## Build & Distribute Ravino Kashrut

### Prerequisites
- Node.js installed on the development machine
- All npm dependencies installed (`npm install` in project root)

### Steps to generate the installer package:

// turbo
1. Run the build script from the project root:
```
cmd /c "c:\Users\sist-ing12\Downloads\Proyecto Ravino\build.bat"
```

2. The build creates `dist\RavinoKashrut\` folder containing:
   - `instalar.bat` - Installer for the client
   - `RavinoKashrut.bat` - Direct launcher
   - All application files (server.js, app/, templates, node_modules)

3. Compress the `dist\RavinoKashrut` folder into a ZIP file.

4. Send the ZIP to the client.

### Client installation:
1. Client extracts the ZIP
2. Client runs `instalar.bat`
3. This copies files to `%USERPROFILE%\RavinoKashrut\`
4. Creates a desktop shortcut "Ravino Kashrut"
5. Client double-clicks the shortcut to start

### After updates:
- Make your code changes
- Re-run `build.bat`
- Send the new ZIP to the client
- Client runs `instalar.bat` again (overwrites old version)
