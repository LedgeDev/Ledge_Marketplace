#!/bin/bash

# Source nvm script - Adjust the path according to where nvm.sh is located on your system
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"  # This loads nvm

# Now that nvm is loaded, use it
nvm use 20.11.0

set -a  # Automatically export all variables
source .env
set +a

# Start expo
exec npx expo start -c --port 19000
