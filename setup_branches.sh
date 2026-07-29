#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATE="$SCRIPT_DIR/generate_lessons.py"
TAIL_LINE=$(grep -n "lessons_data.extend" "$GENERATE" | head -1 | cut -d: -f1)

run_branch() {
  BRANCH=$1
  UNITS=$2  # e.g. "[unit1]" or "[unit1, unit2]"

  echo "=== 正在更新分支 $BRANCH ==="

  # Force-reset branch to current main
  git branch -f "$BRANCH" main
  git checkout "$BRANCH"

  # Patch the extend line temporarily
  sed -i '' "${TAIL_LINE}s/.*/lessons_data.extend($UNITS)/" "$GENERATE"

  python3 "$GENERATE"
  npm run build

  git add -A
  git commit -m "[$BRANCH] 設定單元範圍 $UNITS"

  # Go back to main and restore generate_lessons.py
  git checkout main
  git checkout main -- "$GENERATE"
}

run_branch "115-1-L1" "[unit1]"
run_branch "115-1-L2" "[unit1, unit2]"
run_branch "115-1-L3" "[unit1, unit2, unit3]"
run_branch "115-1-L4" "[unit1, unit2, unit3, unit4]"

echo "✅ 所有分支建立完成！"
