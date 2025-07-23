#!/bin/bash
set -e

if [ "$1" == "dev" ]; then
    echo ">> Deploy for DEVELOPMENT with short cache..."
    cp vercel.dev.json vercel.json
    vercel --local-config vercel.dev.json
elif [ "$1" == "prod" ]; then
    echo ">> Deploy for PRODUCTION with large cache..."
    cp vercel.prod.json vercel.json
    vercel --prod --local-config vercel.prod.json
else
    echo "Usage: ./deploy.sh [dev|prod]"
    exit 1
fi
