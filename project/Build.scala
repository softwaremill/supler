import sbt._
import Keys._

object BuildSettings {
  val buildSettings = Defaults.defaultSettings ++ Seq(
    organization := "com.softwaremill",
    version := "1-SNAPSHOT",
    scalaVersion := "2.11.1",
    scalacOptions += "",
    licenses := ("Apache2", new java.net.URL("http://www.apache.org/licenses/LICENSE-2.0.txt")) :: Nil
  )
}

object Dependencies {
  val scalaTest = "org.scalatest" %% "scalatest" % "2.1.6" % "test"
  val json4sNative = "org.json4s" %% "json4s-native" % "3.2.10"
  val akka = "com.typesafe.akka" %% "akka-actor" % "2.3.4"

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

  lazy val examples: Project = Project(
    "examples",
    file("examples"),
    settings = buildSettings ++ Seq(
      libraryDependencies ++= Seq(akka, sprayCan, sprayRouting, sprayHttpx))
  ) dependsOn (supler)
}