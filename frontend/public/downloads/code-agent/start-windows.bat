@echo off
echo.
echo  ========================================
echo    CODE AGENT - Assistant de Dev
echo  ========================================
echo.
echo  Installation des dependances...
pip install -r requirements.txt -q
echo.
echo  Lancement de l'agent...
python agent.py
pause
