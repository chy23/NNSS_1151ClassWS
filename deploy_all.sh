#!/bin/bash
set -e

echo "=== 開始打包並部署所有分支 ==="

# 確保在主目錄
cd "$(dirname "$0")"

# 準備統一的發布目錄
rm -rf dist_all
mkdir dist_all

# 1. 處理 main (根目錄)
echo "--- 正在打包 main ---"
git checkout main
npm run build
# 將 main 的內容複製到 dist_all 根目錄
cp -a dist/. dist_all/

# 2. 處理各個分支 (子目錄)
BRANCHES=("115-1-L1" "115-1-L2" "115-1-L3" "115-1-L4")

for BRANCH in "${BRANCHES[@]}"; do
  echo "--- 正在打包 $BRANCH ---"
  git checkout "$BRANCH"
  # 使用帶有子目錄的路徑作為 base
  npx vite build --base="/NNSS_1151ClassWS/$BRANCH/"
  
  # 在 dist_all 中建立子目錄並複製內容
  mkdir -p "dist_all/$BRANCH"
  cp -a dist/. "dist_all/$BRANCH/"
done

# 切回 main
git checkout main

# 3. 部署到 gh-pages
echo "--- 正在部署到 GitHub Pages ---"
npx gh-pages -d dist_all

echo "✅ 部署完成！"
echo "主站點：https://chy23.github.io/NNSS_1151ClassWS/"
for BRANCH in "${BRANCHES[@]}"; do
  echo "分支點：https://chy23.github.io/NNSS_1151ClassWS/$BRANCH/"
done
