#!/bin/bash
echo "Starting ChemQuest Server..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Checking if nodemailer is installed..."
npm list nodemailer || echo "Nodemailer not found, installing..."
npm install nodemailer @types/nodemailer
echo "Starting development server..."
npm run dev