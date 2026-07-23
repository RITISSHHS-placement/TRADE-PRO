#!/usr/bin/env bash
# Simple script to run OWASP ZAP baseline scan against a target
if [ -z "$1" ]; then
  echo "Usage: $0 <target-url>"
  exit 2
fi
TARGET="$1"
echo "Running ZAP baseline scan against $TARGET"
docker run --rm -v $(pwd)/security:/zap/wrk/:Z owasp/zap2docker-stable zap-baseline.py -t "$TARGET" -r zap-report.html
echo "Report saved to security/zap-report.html"
