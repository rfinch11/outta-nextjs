#!/bin/bash

# Script to run the duplicate image fix every hour
# This ensures we stay within Unsplash's 50 requests/hour limit

cd "$(dirname "$0")/.."

# Log file location
LOG_FILE="logs/duplicate-fix-$(date +%Y%m%d).log"
mkdir -p logs

echo "========================================" >> "$LOG_FILE"
echo "Starting duplicate image fix at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the fix script
node scripts/fix-duplicate-images.js >> "$LOG_FILE" 2>&1

echo "Completed at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
