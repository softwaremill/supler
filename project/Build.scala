import sbt.Keys._
import sbt._
import sbtassembly.Plugin._
import AssemblyKeys._

object BuildSettings {
  val buildSettings = Defaults.coreDefaultSettings ++ Seq(
    organization := "com.softwaremill",
    version := "0.1.0",
    scalaVersion := "2.11.4",
    scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-language:existentials", "-language:higherKinds"),

    // Sonatype OSS deployment
    publishTo := {
      val nexus = "https://oss.sonatype.org/"
      val (name, url) = if (isSnapshot.value) ("snapshots", nexus + "content/repositories/snapshots")
      else ("releases", nexus + "service/local/staging/deploy/maven2")
      Some(name at url)
    },
    credentials += Credentials(Path.userHome / ".ivy2" / ".credentials"),
    publishMavenStyle := true,
    publishArtifact in Test := false,
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
    parallelExecution := false,
    homepage := Some(new java.net.URL("https://github.com/softwaremill/supler")),
    licenses := ("Apache2", new java.net.URL("http://www.apache.org/licenses/LICENSE-2.0.txt")) :: Nil
  )
}

object Dependencies {
  val scalaTest     = "org.scalatest"     %% "scalatest"      % "2.1.6"   % "test"
  val json4sNative  = "org.json4s"        %% "json4s-native"  % "3.2.10"
  val akka          = "com.typesafe.akka" %% "akka-actor"     % "2.3.4"
  val jodaTime      = "joda-time"          % "joda-time"      % "2.5"
  val jodaConvert   = "org.joda"           % "joda-convert"   % "1.7"

  val sprayVersion  = "1.3.1"
  val sprayCan      = "io.spray"          %% "spray-can"      % sprayVersion
  val sprayRouting  = "io.spray"          %% "spray-routing"  % sprayVersion
  val sprayHttpx    = "io.spray"          %% "spray-httpx"    % sprayVersion
}

object SuplerBuild extends Build {

  import BuildSettings._
  import Dependencies._

  lazy val root: Project = Project(
    "root",
    file("."),
    settings = buildSettings ++ Seq(publishArtifact := false)
  ) aggregate(supler, suplerjs, examples)

  lazy val supler: Project = Project(
    "supler",
    file("supler"),
    settings = buildSettings ++ Seq(
      libraryDependencies <+= (scalaVersion)("org.scala-lang" % "scala-compiler" % _),
      libraryDependencies ++= Seq(json4sNative, scalaTest))
  )

  lazy val createAndCopySuplerJs = taskKey[Unit]("Create and copy the supler js files.")

  lazy val examples: Project = Project(
    "examples",
    file("examples"),
    settings = buildSettings ++ assemblySettings ++ Seq(
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

  private def haltOnCmdResultError(result: Int) {
    if (result != 0) throw new Exception("Build failed.")
  }

  val updateNpm = baseDirectory map { bd =>
    println("Updating NPM dependencies in " + bd)
    haltOnCmdResultError(Process("npm install", bd)!)
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
    settings = buildSettings ++ Seq(
      test in Test <<= gruntTask("test") dependsOn (test in Test in supler))
  )
}