.. _setup:

Setup
=====

Stable version
--------------

As Supler has two parts, they are deployed in different repositories. The backend can be found in
`Sonatype’s OSS repository <https://oss.sonatype.org/content/repositories/releases/com/softwaremill/supler/supler_2.11/>`_,
and if you have e.g. an SBT build you just need to add::

  libraryDependencies += "com.softwaremill.supler" %% "supler" % "0.2.3"

The frontend is deployed to `Bower <http://bower.io/search/?q=supler>`_, and you can install it simply using
``bower install supler``. Or you can just grab ``supler.js`` directly from the
`GitHub tag <https://github.com/softwaremill/supler/blob/0.2.3/supler.js>`_.

Development version
-------------------

If you like living on the edge, you can use development version of supler.

Add the SNAPSHOT repository (this is SBT, but the repository is maven - you can use it in your favorite build system)::

  resolvers += "OSS JFrog Artifactory" at "http://oss.jfrog.org/artifactory/oss-snapshot-local"

and then add the dependencies for both supler backend::

  libraryDependencies += "com.softwaremill.supler" %% "supler" % "0.3.0-SNAPSHOT"

and frontend (in bower.json)::

  "supler": "softwaremill/supler#master"
