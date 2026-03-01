#!/usr/bin/env bash

# Pre commit checks to ensure code quality and formatting

function error_with_message {
    echo $1
    exit 1
}


function run_html_tidy {
    echo "Running HTML Tidy on $1"
    find ./www/$1/ -name "*.html" | while read -r f; do
        echo "$f"
        tidy --custom-tags blocklevel -m -i -c "$f" || true
    done
}

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "Running pre-commit checks"

# Check if all necessary commands are available 
if ! command -v go &> /dev/null
then
    error_with_message "go could not be found, please install go"
fi

if ! command -v tidy &> /dev/null
then
    error_with_message "tidy could not be found, please install tidy"
fi

## Check golang source code
echo "Checking golang source code"
cd $REPO_ROOT || error_with_message "Failed to change directory to $REPO_ROOT"

cd $REPO_ROOT/infra/src || error_with_message "Failed to change directory to infra/src"
go fmt ./...
go build -o /dev/null

## Check html
echo "Checking HTML files"
cd $REPO_ROOT || error_with_message "Failed to change directory to $REPO_ROOT"

run_html_tidy "sramek-garden-center"