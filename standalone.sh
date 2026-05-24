#!/usr/bin/env bash

cat << EOF
<!doctype html>
<meta charset="UTF-8" />
<html lang="en">
    <head>
        <title>democapsid</title>
        <style>
EOF
awk '{ print("            "$0); }' css/app.css
echo "        </style>"
echo '        <script type="text/javascript">'
awk '{ print("            "$0); }' js/democapsid.app.js
echo "        </script>"
awk '$0 ~ /<\/head>/ { f=1; } f' app.dev.html
