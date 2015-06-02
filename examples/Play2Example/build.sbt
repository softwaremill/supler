name := """Play2Example"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.6"

lazy val localIvy2Repo = Resolver.url("Local IVY2 Repository", url("file://"+Path.userHome.absolutePath+"/.ivy2/local"))(Resolver.ivyStylePatterns)

resolvers ++= Seq("Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/",
    "JTO snapshots" at "https://raw.github.com/jto/mvn-repo/master/snapshots",
    Resolver.url("scala-js-snapshots",
      url("http://repo.scala-js.org/repo/snapshots/"))(Resolver.ivyStylePatterns),
    "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots",
    "Sonatype Snapshots" at "http://oss.sonatype.org/content/repositories/snapshots/",
    "bintray/non" at "http://dl.bintray.com/non/maven",
    "Scalaz Bintray Repo" at "http://dl.bintray.com/scalaz/releases",
    "Rhinofly Internal Release Repository" at "http://maven-repository.rhinofly.net:8081/artifactory/libs-release-local",
    "Mandubian repository snapshots" at "https://github.com/mandubian/mandubian-mvn/raw/master/snapshots/",
    "Mandubian repository releases" at "https://github.com/mandubian/mandubian-mvn/raw/master/releases/",
    "OSS JFrog Artifactory" at "http://oss.jfrog.org/artifactory/oss-snapshot-local",
    Resolver.url("scala-js-releases",
      url("http://dl.bintray.com/content/scala-js/scala-js-releases"))(
      Resolver.ivyStylePatterns),localIvy2Repo)


libraryDependencies ++= Seq(
  jdbc,
  cache,
  ws,
  "org.webjars" % "jquery" % "2.1.1",
  "org.webjars" % "bootstrap" % "3.3.4",
  "org.webjars" % "bootstrap-datepicker" % "1.4.0",
  "org.webjars.bower" % "bootstrap-3-datepicker" % "1.4.0",
  "org.json4s" %% "json4s-native" % "3.2.10" withSources(),
  "com.github.tototoshi" %% "play-json4s-native" % "0.3.1" withSources(),
  "io.spray" %% "spray-httpx" % "1.3.1" withSources(),
  "com.softwaremill.supler" %% "supler" % "0.3.0-SNAPSHOT" withSources(),
  "org.specs2" %% "specs2" % "2.4.3" % "test"
)
