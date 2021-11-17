#!/bin/bash

# set -x

echo "Downloading and extracting extension ..."

# remove any old version if one exists
rm -rf ~/Downloads/mkto-chrome-ext.zip || :

master_ver=$(curl -sS https://raw.githubusercontent.com/PMET-public/ml-ext-dist/master/manifest.json | perl -ne 's/^\s*"version"\s*:\s*"(.*)".*/\1/ and print')

curl -L -o ~/Downloads/mkto-chrome-ext.zip --create-dirs https://github.com/PMET-public/ml-ext-dist/releases/download/v$master_ver/mkto-chrome-ext.zip

# delete everything but the existing manifest (so chrome will not throw an error but the manifest will still be overwritten when the zip is expanded)
find ~/Downloads/mkto-chrome-ext -type f ! -name 'manifest.json' -delete 2> /dev/null || :
unzip -o -d ~/Downloads/mkto-chrome-ext ~/Downloads/mkto-chrome-ext.zip
rm ~/Downloads/mkto-chrome-ext.zip