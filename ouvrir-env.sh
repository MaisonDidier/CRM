#!/bin/bash
# Script pour ouvrir le fichier .env.local

echo "📍 Emplacement du fichier .env.local :"
echo "$(pwd)/.env.local"
echo ""
echo "📝 Ouverture du fichier..."

# Essayer d'ouvrir avec différents éditeurs
if command -v code &> /dev/null; then
    code .env.local
    echo "✅ Fichier ouvert dans VS Code"
elif command -v nano &> /dev/null; then
    nano .env.local
elif command -v vim &> /dev/null; then
    vim .env.local
else
    open -e .env.local 2>/dev/null || open -a "TextEdit" .env.local
    echo "✅ Fichier ouvert dans TextEdit"
fi





