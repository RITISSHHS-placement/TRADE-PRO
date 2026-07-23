#!/usr/bin/env bash
echo "Running semgrep with local rules against repo root"
if ! command -v semgrep >/dev/null 2>&1; then
  echo "semgrep not installed. Install via 'pip install semgrep' or see https://semgrep.dev"
  exit 1
fi
semgrep --config security/semgrep-rules.yml --verbose
