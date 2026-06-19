#!/usr/bin/env bash
# ================================================================
# TradePro — One-command GitHub push & deploy setup
# Usage: bash setup-github.sh
# ================================================================

set -e

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}${CYAN}  ◈ TradePro GitHub Setup${RESET}"
echo -e "  Pushing your project to GitHub and configuring deployment."
echo ""

# ── 1. Check prerequisites ──────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}✗ '$1' not found. Please install it first.${RESET}"
    exit 1
  fi
}

check_cmd git
check_cmd gh     # GitHub CLI — install from https://cli.github.com

# ── 2. Auth check ───────────────────────────────────────────────
if ! gh auth status &>/dev/null; then
  echo -e "${YELLOW}→ Logging into GitHub CLI...${RESET}"
  gh auth login
fi

echo -e "${GREEN}✓ GitHub CLI authenticated${RESET}"

# ── 3. Collect repo info ────────────────────────────────────────
read -p "  GitHub username: " GH_USER
read -p "  Repository name [tradepro]: " REPO_NAME
REPO_NAME=${REPO_NAME:-tradepro}
read -p "  Make repo private? (y/N): " PRIVATE_CHOICE

PRIVATE_FLAG=""
if [[ "$PRIVATE_CHOICE" =~ ^[Yy]$ ]]; then
  PRIVATE_FLAG="--private"
else
  PRIVATE_FLAG="--public"
fi

# ── 4. Init git if needed ───────────────────────────────────────
cd "$(dirname "$0")"   # go to project root

if [ ! -d .git ]; then
  git init
  echo -e "${GREEN}✓ Git initialized${RESET}"
fi

# ── 5. .gitignore ───────────────────────────────────────────────
cat > .gitignore << 'EOF'
# Java / Maven
backend/target/
backend/*.log
*.class
*.jar
!backend/target/*.jar

# Node
frontend/node_modules/
frontend/dist/
frontend/.env
*.env.local

# IDE
.idea/
.vscode/
*.iml
*.DS_Store

# Docker
*.pid

# Logs
*.log
logs/
EOF

echo -e "${GREEN}✓ .gitignore written${RESET}"

# ── 6. Create GitHub repo ───────────────────────────────────────
echo -e "${YELLOW}→ Creating GitHub repository '${REPO_NAME}'...${RESET}"
gh repo create "${GH_USER}/${REPO_NAME}" \
  ${PRIVATE_FLAG} \
  --description "TradePro — Institutional-grade trading platform" \
  --source=. \
  --remote=origin \
  --push 2>/dev/null || true

# In case repo already exists, just set remote
git remote 2>/dev/null | grep -q origin || \
  git remote add origin "https://github.com/${GH_USER}/${REPO_NAME}.git"

# ── 7. First commit ─────────────────────────────────────────────
git add -A
git diff --cached --quiet || git commit -m "🚀 Initial commit — TradePro full-stack skeleton"

git branch -M main
git push -u origin main

echo -e "${GREEN}✓ Code pushed to github.com/${GH_USER}/${REPO_NAME}${RESET}"

# ── 8. Enable GitHub Pages ──────────────────────────────────────
echo -e "${YELLOW}→ Enabling GitHub Pages (gh-pages branch)...${RESET}"
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/${GH_USER}/${REPO_NAME}/pages" \
  -f source='{"branch":"gh-pages","path":"/"}' 2>/dev/null || \
  echo -e "${YELLOW}  (Pages will auto-enable after first deploy)${RESET}"

# ── 9. Set GITHUB_TOKEN secret (auto) ───────────────────────────
echo -e "${YELLOW}→ Configuring secrets...${RESET}"
echo ""
echo -e "${BOLD}  Now set the following GitHub Actions secrets:${RESET}"
echo -e "  Go to: https://github.com/${GH_USER}/${REPO_NAME}/settings/secrets/actions"
echo ""
echo -e "  ${BOLD}Required:${RESET}"
echo -e "  ${CYAN}RAILWAY_TOKEN${RESET}       → Get from https://railway.app/account/tokens"
echo -e "  ${CYAN}VITE_API_URL${RESET}        → Your Railway backend URL, e.g. https://tradepro-backend.up.railway.app/api"
echo ""
echo -e "  ${BOLD}Optional (only if not using Railway):${RESET}"
echo -e "  ${CYAN}DATABASE_URL${RESET}        → PostgreSQL connection string"
echo -e "  ${CYAN}JWT_SECRET${RESET}          → Random 64-char string"
echo ""

# ── 10. Summary ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}  ✓ All done! Here's your TradePro dashboard:${RESET}"
echo ""
echo -e "  ${BOLD}GitHub Repo:${RESET}    https://github.com/${GH_USER}/${REPO_NAME}"
echo -e "  ${BOLD}GitHub Pages:${RESET}   https://${GH_USER}.github.io/${REPO_NAME}/"
echo -e "  ${BOLD}Actions:${RESET}        https://github.com/${GH_USER}/${REPO_NAME}/actions"
echo ""
echo -e "  ${YELLOW}→ Every push to 'main' will auto-deploy frontend to GitHub Pages${RESET}"
echo -e "  ${YELLOW}→ Backend deploys to Railway automatically via RAILWAY_TOKEN${RESET}"
echo ""
