#!/usr/bin/env bash
set -e

CMD="$1"

if [[ "$CMD" == *"rm -rf"* ]] || [[ "$CMD" == *"git push --force"* ]]; then
  echo "Blocked potentially destructive command: $CMD"
  exit 1
fi

if [[ "$CMD" == *".env"* ]] || [[ "$CMD" == *"token"* ]] || [[ "$CMD" == *"secret"* ]]; then
  echo "Warning: command may involve sensitive material."
fi

exit 0