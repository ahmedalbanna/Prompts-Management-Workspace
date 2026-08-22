!include "MUI2.nsh"
!include "FileFunc.nsh"

!define MUI_ICON "..\src-tauri\icons\icon.ico"
!define MUI_UNICON "..\src-tauri\icons\icon.ico"

; WebView2 evergreen runtime bootstrapper
!define WEBVIEW2_URL "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
!define WEBVIEW2_INSTALLER "$TEMP\MicrosoftEdgeWebview2Setup.exe"
!define WEBVIEW2_REGKEY "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

;---------------------------------------
; Product configuration
!define APPNAME "PromptCraft Studio"
!define APPVERSION "0.1.0"
!define PUBLISHER "PromptCraft"
!define EXENAME "prompts-management-workspace-tauri.exe"
!define APPID "com.promptcraft.studio"

Name "${APPNAME}"
OutFile "PromptCraftStudio-Setup-${APPVERSION}-x64.exe"
InstallDir "$PROGRAMFILES64\${APPNAME}"
InstallDirRegKey HKLM "Software\${APPNAME}" "InstallDir"
RequestExecutionLevel admin
Unicode true

;---------------------------------------
; Modern UI
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

;---------------------------------------
; Ensure the Microsoft Edge WebView2 runtime is present (Tauri needs it on Windows)
Function EnsureWebView2
  SetRegView 64
  ClearErrors
  ReadRegStr $R0 HKLM "${WEBVIEW2_REGKEY}" "pv"
  IfErrors check_wow webview2_found

  check_wow:
    ReadRegStr $R0 HKLM "SOFTWARE\Wow6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    IfErrors install_webview2 webview2_found

  install_webview2:
    DetailPrint "WebView2 runtime not detected. Downloading Microsoft Edge WebView2 Runtime..."
    ExecWait 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri $\"${WEBVIEW2_URL}$\" -OutFile $\"${WEBVIEW2_INSTALLER}$\""' $0
    DetailPrint "WebView2 download finished (exit $0)."
    ExecWait '$\"${WEBVIEW2_INSTALLER}$\" --silent --system' $1
    DetailPrint "WebView2 installer exited with code $1."
    Delete "${WEBVIEW2_INSTALLER}"

    ; Re-check after install attempt
    ClearErrors
    ReadRegStr $R0 HKLM "${WEBVIEW2_REGKEY}" "pv"
    IfErrors webview2_failed webview2_found

  webview2_failed:
    MessageBox MB_OK|MB_ICONEXCLAMATION \
      "Could not automatically install the Microsoft Edge WebView2 Runtime (exit code $1).$\n$\n\
       Please install it manually from:$\n${WEBVIEW2_URL}$\n$\n\
       then launch ${APPNAME}." /SD IDOK
    Goto webview2_end

  webview2_found:
    DetailPrint "WebView2 runtime is present."

  webview2_end:
FunctionEnd

;---------------------------------------
; Installer
Section "Install" SecInstall
  SetOutPath "$INSTDIR"
  Call EnsureWebView2
  File "..\src-tauri\target\x86_64-pc-windows-gnu\release\${EXENAME}"

  ; Metadata for Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "DisplayName" "${APPNAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "DisplayVersion" "${APPVERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}" "NoRepair" 1

  ; Start Menu shortcut
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0
  CreateShortcut "$SMPROGRAMS\${APPNAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0

  ; Uninstaller
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

;---------------------------------------
; Uninstaller
Section "Uninstall" SecUninstall
  Delete "$INSTDIR\${EXENAME}"
  Delete "$INSTDIR\uninstall.exe"
  Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME}\Uninstall.lnk"
  RMDir "$SMPROGRAMS\${APPNAME}"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPID}"
  DeleteRegKey HKLM "Software\${APPNAME}"
SectionEnd
