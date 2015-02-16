#!/bin/sh
if [[ ${PROJECT_VERSION} != *-SNAPSHOT ]]
then
    curl -vvf -u$BINTRAY_USER:$BINTRAY_PASSWORD -H "Content-Type: application/json" \
        -X POST https://bintray.com/api/v1/maven_central_sync/softwaremill/softwaremill/supler/versions/${PROJECT_VERSION} \
        --data "{ \"username\": \"${SONATYPE_USER}\", \"password\": \"${SONATYPE_PASSWORD}\", \"close\": \"1\" }"
    echo "Release synchronized to central"
else
    echo "Ignoring snapshot version"
fi