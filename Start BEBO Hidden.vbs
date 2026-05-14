Set shell = CreateObject("WScript.Shell")
project = "C:\Users\admin\OneDrive - Lal Bahadur Shastri Institute of Management\Documents\BEBO the PET"
npm = "C:\nodejs\npm.cmd"
shell.CurrentDirectory = project
shell.Run "cmd /c """ & npm & """ start", 0, False
