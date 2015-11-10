import sbtassembly.Plugin.AssemblyKeys._

enablePlugins(BintrayPlugin)

val scalaTest = "org.scalatest" %% "scalatest" % "2.1.6" % "test"
val json4sNative = "org.json4s" %% "json4s-native" % "3.2.10"
val akka = "com.typesafe.akka" %% "akka-actor" % "2.3.4"
val jodaTime = "joda-time" % "joda-time" % "2.5"
val jodaConvert = "org.joda" % "joda-convert" % "1.7"

val sprayVersion = "1.3.1"
val sprayCan = "io.spray" %% "spray-can" % sprayVersion
val sprayRouting = "io.spray" %% "spray-routing" % sprayVersion
val sprayHttpx = "io.spray" %% "spray-httpx" % sprayVersion

val Version = "0.3.1i-SNAPSHOT"

val buildSettings = Defaults.coreDefaultSettings ++ Seq(
  version := Version,
  scalaVersion := "2.11.5",
  scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-language:existentials", "-language:higherKinds"),
  parallelExecution := false
)

val doNotPublishSettings = Seq(publish := {})

val publishSettings =
  (if (Version.endsWith("-SNAPSHOT"))
    Seq(
      publishTo := Some("Artifactory Realm" at "http://oss.jfrog.org/artifactory/oss-snapshot-local"),
      bintrayReleaseOnPublish := false,
      // Only setting the credentials file if it exists (#52)
      credentials := List(Path.userHome / ".bintray" / ".artifactory").filter(_.exists).map(Credentials(_))
    )
  else
    Seq(
      bintrayOrganization := Some("softwaremill"),
      bintrayRepository := "softwaremill")
    ) ++ Seq(
    organization := "com.softwaremill.supler",
    pomExtra := <scm>
      <url>git@github.com:softwaremill/supler.git</url>
      <connection>scm:git:git@github.com:softwaremill/supler.git</connection>
    </scm>
      <developers>
        <developer>
          <id>szimano</id>
          <name>Tomasz Szymanski</name>
          <url>http://www.szimano.org</url>
        </developer>
        <developer>
          <id>adamw</id>
          <name>Adam Warski</name>
          <url>http://www.warski.org</url>
        </developer>
      </developers>,
    publishMavenStyle := false,
    publishArtifact in Test := false,
    homepage := Some(url("https://github.com/softwaremill/supler")),
    resolvers += Resolver.url("supler ivy resolver", url("http://dl.bintray.com/softwaremill/maven"))(Resolver.ivyStylePatterns),
    licenses := ("Apache-2.0", url("http://www.apache.org/licenses/LICENSE-2.0.txt")) :: Nil
  )

def haltOnCmdResultError(result: Int) {
  if (result != 0) {
    throw new Exception("Build failed.")
  }
}

lazy val makeVersionSh = taskKey[Seq[File]]("Creates .run.central.synchro.sh file.")

lazy val root: Project = Project(
  "root",
  file("."),
  settings = buildSettings ++ doNotPublishSettings ++ Seq(
    publishArtifact := false,
    makeVersionSh := {
      val pf = new java.io.File(".run.central.synchro.sh")
      val content = s"""|#!/bin/bash
                       |PROJECT_VERSION=${version.value} /bin/bash .central.synchro.sh
                      """.stripMargin
      IO.write(pf, content)
      Seq(pf)
    }
  )
) aggregate(supler, suplerjs, examples)

lazy val supler: Project = Project(
  "supler",
  file("supler"),
  settings = buildSettings ++ publishSettings ++ Seq(
    libraryDependencies <+= (scalaVersion)("org.scala-lang" % "scala-compiler" % _ % "provided"),
    libraryDependencies ++= Seq(json4sNative, scalaTest))
)

lazy val createAndCopySuplerJs = taskKey[Unit]("Create and copy the supler js files.")

lazy val examples: Project = Project(
  "examples",
  file("examples"),
  settings = buildSettings ++ doNotPublishSettings ++ assemblySettings ++ Seq(
    libraryDependencies ++= Seq(akka, sprayCan, sprayRouting, sprayHttpx, jodaTime, jodaConvert),
    jarName in assembly := "supler-example.jar",
    mainClass in assembly := Some("org.demo.DemoServer"),
    createAndCopySuplerJs := {
      val suplerJsDir = baseDirectory.value / ".." / "supler-js"

      println("Running grunt")
      Process(List("grunt", "ts"), suplerJsDir.getCanonicalFile).!

      val suplerJsSource = suplerJsDir / "target" / "supler.js"
      val suplerJsTarget = (classDirectory in Compile).value / "supler.js"
      println(s"Copying supler.js to resources from $suplerJsSource to $suplerJsTarget")
      IO.copy(List((suplerJsSource, suplerJsTarget)))
    },
    assembly <<= assembly.dependsOn(createAndCopySuplerJs),
    publishArtifact := false)
) dependsOn (supler)

val updateNpm = baseDirectory map { bd =>
  println("Updating NPM dependencies in " + bd)
  haltOnCmdResultError(Process("npm install", bd) !)
  println("NPM dependencies updated")
}

def gruntTask(taskName: String) = (baseDirectory, streams) map { (bd, s) =>
  val localGruntCommand = "./node_modules/.bin/grunt " + taskName
  def buildGrunt() = {
    Process(localGruntCommand, bd).!
  }
  println("Building with Grunt.js : " + taskName)
  haltOnCmdResultError(buildGrunt())
} dependsOn updateNpm

lazy val suplerjs: Project = Project(
  "supler-js",
  file("supler-js"),
  settings = buildSettings ++ publishSettings ++ Seq(
    test in Test <<= gruntTask("test") dependsOn (test in Test in supler))
)
