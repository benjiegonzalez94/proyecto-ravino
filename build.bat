@echo off
chcp 65001 >nul 2>&1
title Ravino Kashrut - Build Installer
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   Ravino Kashrut - Generador de Instalador    ║
echo ╚═══════════════════════════════════════════════╝
echo.

:: Set paths
set "SRC=%~dp0"
set "DIST=%SRC%dist\RavinoKashrut"

:: Clean previous build
if exist "%SRC%dist" (
    echo [1/5] Limpiando build anterior...
    rmdir /s /q "%SRC%dist"
)

:: Create distribution folder
echo [2/5] Creando estructura de distribución...
mkdir "%DIST%"
mkdir "%DIST%\app"
mkdir "%DIST%\node_modules"
mkdir "%DIST%\output"

:: Copy application files
echo [3/5] Copiando archivos de la aplicación...
copy "%SRC%server.js" "%DIST%\" >nul
copy "%SRC%package.json" "%DIST%\" >nul
copy "%SRC%template.docx" "%DIST%\" >nul
copy "%SRC%Lista de Rabanut2.xlsx" "%DIST%\" >nul
xcopy "%SRC%app\*" "%DIST%\app\" /E /Q >nul
xcopy "%SRC%node_modules\*" "%DIST%\node_modules\" /E /Q >nul

:: Create the launcher BAT
echo [4/5] Creando lanzador...
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title Ravino Kashrut - Production Report Generator
echo echo.
echo echo ╔═══════════════════════════════════════════════╗
echo echo ║     Ravino Kashrut - Report Generator         ║
echo echo ║     Iniciando servidor...                     ║
echo echo ╚═══════════════════════════════════════════════╝
echo echo.
echo cd /d "%%~dp0"
echo.
echo :: Check if Node.js is available
echo where node ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo [ERROR] Node.js no encontrado.
echo     echo Por favor instale Node.js desde: https://nodejs.org
echo     echo Descargue la version LTS y ejecute el instalador.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo :: Start server in background and open browser
echo echo Iniciando servidor en puerto 3000...
echo start "" /min cmd /c "node server.js"
echo.
echo :: Wait for server to start
echo timeout /t 2 /nobreak ^>nul
echo.
echo :: Open browser
echo echo Abriendo navegador...
echo start http://localhost:3000
echo.
echo echo.
echo echo ═══════════════════════════════════════════════
echo echo   El programa esta corriendo.
echo echo   NO CIERRE esta ventana mientras lo usa.
echo echo   Para detener, cierre esta ventana.
echo echo ═══════════════════════════════════════════════
echo echo.
echo pause
echo :: Kill node when done
echo taskkill /f /im node.exe ^>nul 2^>^&1
) > "%DIST%\RavinoKashrut.bat"

:: Create the installer BAT
(
echo @echo off
echo chcp 65001 ^>nul 2^>^&1
echo title Ravino Kashrut - Instalador
echo echo.
echo echo ╔═══════════════════════════════════════════════╗
echo echo ║     Ravino Kashrut - Instalador               ║
echo echo ╚═══════════════════════════════════════════════╝
echo echo.
echo.
echo :: Check Node.js
echo where node ^>nul 2^>^&1
echo if %%errorlevel%% neq 0 ^(
echo     echo [!] Node.js no esta instalado.
echo     echo     Abriendo pagina de descarga...
echo     start https://nodejs.org
echo     echo.
echo     echo     Instale Node.js LTS y luego ejecute este instalador de nuevo.
echo     pause
echo     exit /b 1
echo ^)
echo echo [OK] Node.js encontrado.
echo.
echo :: Set install path
echo set "INSTALL_DIR=%%USERPROFILE%%\RavinoKashrut"
echo.
echo echo Instalando en: %%INSTALL_DIR%%
echo echo.
echo.
echo :: Backup existing data before update
echo if exist "%%INSTALL_DIR%%\data.json" ^(
echo     echo [*] Respaldando datos del usuario...
echo     copy "%%INSTALL_DIR%%\data.json" "%%TEMP%%\ravino_data_backup.json" /Y ^>nul
echo ^)
echo.
echo :: Copy files
echo if exist "%%INSTALL_DIR%%" rmdir /s /q "%%INSTALL_DIR%%"
echo xcopy "%%~dp0\*" "%%INSTALL_DIR%%\" /E /Q /Y ^>nul
echo echo [OK] Archivos copiados.
echo.
echo :: Restore user data if backup exists
echo if exist "%%TEMP%%\ravino_data_backup.json" ^(
echo     echo [*] Restaurando datos del usuario...
echo     copy "%%TEMP%%\ravino_data_backup.json" "%%INSTALL_DIR%%\data.json" /Y ^>nul
echo     del "%%TEMP%%\ravino_data_backup.json" ^>nul
echo     echo [OK] Datos restaurados.
echo ^)
echo.
echo :: Create Desktop shortcut via PowerShell
echo echo Creando acceso directo en el escritorio...
echo powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.IO.Path]::Combine($ws.SpecialFolders('Desktop'), 'Ravino Kashrut.lnk')); $s.TargetPath = [System.IO.Path]::Combine($env:USERPROFILE, 'RavinoKashrut', 'RavinoKashrut.bat'); $s.WorkingDirectory = [System.IO.Path]::Combine($env:USERPROFILE, 'RavinoKashrut'); $s.Description = 'Ravino Kashrut Report Generator'; $s.Save()"
echo echo [OK] Acceso directo creado en el escritorio.
echo.
echo echo.
echo echo ═══════════════════════════════════════════════
echo echo   Instalacion completada exitosamente!
echo echo   Busque "Ravino Kashrut" en su escritorio.
echo echo ═══════════════════════════════════════════════
echo echo.
echo pause
) > "%DIST%\instalar.bat"

echo [5/5] Build completado!
echo.
echo ═══════════════════════════════════════════════
echo   Distribución creada en:
echo   %DIST%
echo.
echo   Contenido:
echo     - instalar.bat     (instalador para el cliente)
echo     - RavinoKashrut.bat (lanzador directo)
echo     - server.js + app/  (aplicación)
echo.
echo   Para enviar al cliente:
echo     Comprima la carpeta "dist\RavinoKashrut" en un ZIP
echo     y envíelo. El cliente ejecuta "instalar.bat".
echo ═══════════════════════════════════════════════
echo.
pause
