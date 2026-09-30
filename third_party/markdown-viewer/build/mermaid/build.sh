#!/bin/bash

# set current working directory to directory of the shell script
cd "$(dirname "$0")"

# before
npm ci 2> /dev/null || npm i
mkdir -p tmp

# Mermaid 12 publishes ESM; bundle it for Chrome's scripting.executeScript.
./node_modules/.bin/esbuild entry.js \
  --bundle --minify --format=iife --platform=browser \
  --target=chrome121 --outfile=tmp/mermaid.min.js

# copy
cp tmp/mermaid.min.js ../../vendor/mermaid.min.js

# after
rm -rf node_modules/ tmp/
