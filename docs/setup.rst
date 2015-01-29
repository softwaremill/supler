.. _setup:

Setup
=====

As Supler has two parts, they are deployed in different repositories. The backend can be found in
`Sonatype’s OSS repository <https://oss.sonatype.org/content/repositories/releases/com/softwaremill/supler_2.11/>`_,
and if you have e.g. an SBT build you just need to add::

  libraryDependencies += "com.softwaremill" %% "supler" % "0.2.0"

The frontend is deployed to `Bower <http://bower.io/search/?q=supler>`_, and you can install it simply using
``bower install supler``. Or you can just grab ``supler.js`` directly from the
`GitHub tag <https://github.com/softwaremill/supler/blob/0.2.0/supler.js>`_.