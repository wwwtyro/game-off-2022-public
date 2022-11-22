rm -rf dist
npm run build-itch
cd dist && zip -r ../guns-blazing.zip *
cd .. && rm -rf dist
