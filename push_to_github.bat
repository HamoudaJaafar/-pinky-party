@echo off
chcp 65001 > nul
title Déploiement Pinky Party sur GitHub
echo ====================================================
echo 🚀 INITIALISATION DE GIT ET PRÉPARATION DU CODE
echo ====================================================
echo.

:: Vérification si git est disponible dans le path global ou local
where git >nul 2>&1
if %errorlevel% neq 0 (
    :: Essayer le chemin d'installation par défaut
    set "PATH=%PATH%;C:\Program Files\Git\cmd"
)

:: Re-vérifier
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erreur : Git n'a pas pu être localisé dans votre système.
    echo Veuillez installer Git ou téléverser les fichiers manuellement sur GitHub.
    pause
    exit /b
)

:: Initialiser le dépôt
if not exist .git (
    echo 🔧 Création d'un nouveau dépôt Git local...
    git init
) else (
    echo 📁 Dépôt Git local existant détecté.
)

:: Créer le fichier .gitignore si absent
if not exist .gitignore (
    echo 📝 Création du fichier .gitignore...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo server/database.db >> .gitignore
)

:: Ajouter et commiter les fichiers
echo 📂 Ajout des fichiers au dépôt...
git add .

echo 💾 Création du commit...
git commit -m "Mise à jour Render.yaml et intégration API WhatsApp Meta"

echo.
echo ====================================================
echo ✅ CODE PRÊT À ÊTRE ENVOYÉ !
echo ====================================================
echo.
echo Étape 1 : Allez sur https://github.com/new et créez un dépôt nommé 'pinky-party'
echo Étape 2 : Copiez l'URL de votre dépôt (ex: https://github.com/HamoudaJaafar/-pinky-party
echo.
set /p repo_url="➡️ Collez l'URL de votre dépôt GitHub ici et appuyez sur Entrée : "

if "%repo_url%"=="" (
    echo ❌ URL invalide. Opération annulée.
    pause
    exit /b
)

:: Associer le dépôt distant et pousser
git remote remove origin >nul 2>&1
git remote add origin %repo_url%
git branch -M main

echo.
echo 📤 Envoi du code vers GitHub...
git push -u origin main --force

echo.
if %errorlevel% equ 0 (
    echo ====================================================
    echo 🎉 SUCCÈS : Votre code est en ligne sur GitHub !
    echo ====================================================
) else (
    echo ⚠️ L'envoi a échoué. Si une fenêtre s'est ouverte, connectez-vous à GitHub.
)
echo.
pause
