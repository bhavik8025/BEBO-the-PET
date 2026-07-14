
' Launches BEBO silently via npm start — no CMD window visible
Dim shell
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = "C:\Users\admin\OneDrive - Lal Bahadur Shastri Institute of Management\Documents\BEBO the PET"
shell.Run "cmd /c npm start", 0, False
Set shell = Nothing
