#!/bin/sh

set -e

# Executable all the helpers
if [ -d "/helpers" ]; then
  chmod +x /helpers/* || true
fi;

if [ -f "/helpers/user-perms.sh" ] && [ -z ${LANDO_NO_USER_PERMS+x} ]; then
  chmod +x /helpers/user-perms.sh || true
  /helpers/user-perms.sh
fi;

# Run any scripts that we've loaded into the mix for autorun
if [ -d "/scripts" ] && [ -z ${LANDO_NO_SCRIPTS+x} ]; then
  chmod +x /scripts/* || true
  find /scripts/ -type f -exec {} \;
fi;

# Run the COMMAND
echo "Running command $@"
"$@" || tail -f /dev/null
