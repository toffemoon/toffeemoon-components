' Hidden-window wrapper so double-click shows no console flash.
' ASCII-only: wscript reads .vbs as ANSI; paths are derived at runtime.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & dir & "\launcher.ps1""", 0, False
