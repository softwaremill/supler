#!/bin/bash
mkdir ~/.bintray/
BINTRAY_FILE=$HOME/.bintray/.credentials
ARTIFACTORY_FILE=$HOME/.bintray/.artifactory
cat <<EOF >$BINTRAY_FILE
realm = Bintray API Realm
host = api.bintray.com
user = $BINTRAY_USER
password = $BINTRAY_PASSWORD
EOF

cat <<EOF >$ARTIFACTORY_FILE
realm = Artifactory Realm
host = oss.jfrog.org
user = $BINTRAY_USER
password = $BINTRAY_PASSWORD
EOF