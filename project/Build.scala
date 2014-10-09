import sbt.Keys._
import sbt._
import sbtassembly.Plugin._
import AssemblyKeys._

object BuildSettings {
  val buildSettings = Defaults.coreDefaultSettings ++ Seq(
    organization := "com.softwaremill",
    version := "1-SNAPSHOT",
    scalaVersion := "2.11.2",
    scalacOptions ++= Seq("-unchecked", "-deprecation", "-feature", "-language:existentials", "-language:higherKinds"),
    licenses := ("Apache2", new java.net.URL("http://www.apache.org/licenses/LICENSE-2.0.txt")) :: Nil
  )
}

object Dependencies {
  val scalaTest = "org.scalatest" %% "scalatest" % "2.1.6" % "test"
  val json4sNative = "org.json4s" %% "json4s-native" % "3.2.10"
  val akka = "com.typesafe.akka" %% "akka-actor" % "2.3.4"
  val jodaTime      = "joda-time"                 % "joda-time"             % "2.5"
  val jodaConvert   = "org.joda"                  % "joda-convert"          % "1.7"

  val sprayVersion = "1.3.1"
  val sprayCan = "io.spray" %% "spray-can" % sprayVersion
  val sprayRouting = "io.spray" %% "spray-routing" % sprayVersion
  val sprayHttpx = "io.spray" %% "spray-httpx" % sprayVersion
}

object SuplerBuild extends Build {

  import BuildSettings._
  import Dependencies._

  lazy val root: Project = Project(
    "root",
    file("."),
    settings = buildSettings
  ) aggregate(supler, examples)

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
      mainClass in assembly := Some("org.supler.demo.DemoServer"),
      createAndCopySuplerJs := {
        val suplerJsDir = baseDirectory.value / ".." / "supler-js"

        println("Running grunt")
        Process(List("grunt", "ts"), suplerJsDir.getCanonicalFile).!

        val suplerJsSource = suplerJsDir / "app" / "scripts" / "compiled" / "supler.out.js"
        val suplerJsTarget = (classDirectory in Compile).value / "supler.out.js"
        println(s"Copying supler.js to resources from $suplerJsSource to $suplerJsTarget")
        IO.copy(List((suplerJsSource, suplerJsTarget)))
      },
      assembly <<= assembly.dependsOn(createAndCopySuplerJs))
  ) dependsOn (supler)
}