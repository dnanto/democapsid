#!/usr/bin/env bash

npm_package_name="$1"
npm_package_version="$2"

echo "# bump" && \
sed -i '' -E -e 's/v\.?[0-9]+\.[0-9]+\.[0-9]+/v'"$npm_package_version"'/' README.md app.dev.html && \
echo "- clean" && \
rm -f  "$npm_package_name".{tar.gz,zip,min.js,app.js} && \
echo "# update" && \
cp node_modules/chroma-js/dist/chroma.min.cjs js/lib/chroma && \
cp node_modules/paper/dist/paper-core.min.js js/lib/paper && \
cp node_modules/qr-code-styling/lib/qr-code-styling.js js/lib/qr-code-styling && \
echo "# combine" && \
cat \
    js/array.js \
    js/numerical.js \
    js/util.js \
    js/graph.js \
    js/ico.js \
    js/wythoff.js \
    js/capsid.js \
    > "js/$npm_package_name.js" 
echo "# minifyjs" && \
terser \
    --ecma 5 --comments --compress ecma=5 --ie8 --safari10 --timings "js/$npm_package_name.js" --mangle toplevel --keep-fnames -o "js/$npm_package_name.min.js" && \
echo "# minifyapp" && \
terser --ecma 5 --comments --compress ecma=5 --ie8 --safari10 --timings \
    js/lib/chroma/chroma.min.cjs js/lib/paper/paper-core.min.js js/lib/qr-code-styling/qr-code-styling.js "js/$npm_package_name.js" js/main.js \
    --mangle toplevel --keep-fnames -o "js/$npm_package_name.app.js" && \
echo "# compress" && \
zip -j "$npm_package_name-$npm_package_version.zip" "js/$npm_package_name.js" "js/$npm_package_name.min.js" && \
tar cvzf "$npm_package_name-$npm_package_version.tar.gz" -C js "$npm_package_name.js" "$npm_package_name.min.js" && \
echo "# standalone" && \
{
    echo "<!doctype html>"
    echo '<meta charset="UTF-8" />'
    echo '<html lang="en">'
    echo "    <head>"
    echo "        <title>$npm_package_name</title>"
    echo "        <style>"
    awk '{ print("            "$0); }' css/app.css
    echo "        </style>"
    echo '        <script type="text/javascript">'
    awk '{ print("            "$0); }' "js/$npm_package_name.app.js"
    echo "        </script>"
    awk '$0 ~ /<\/head>/ { f=1; } f' app.dev.html
} > app.html
