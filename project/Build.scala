import sbt._
import Keys._

object BuildSettings {
  val buildSettings = Defaults.defaultSettings ++ Seq (
    organization  := "com.softwaremill",
    version       := "1-SNAPSHOT",
    scalaVersion  := "2.11.1",
    scalacOptions += "",
    licenses      := ("Apache2", new java.net.URL("http://www.apache.org/licenses/LICENSE-2.0.txt")) :: Nil
  )
}

object Dependencies {
	val scalaTest = "org.scalatest" %% "scalatest" % "2.1.6" % "test"
}

object SuplerBuild extends Build {
  import BuildSettings._
  import Dependencies._

  lazy val root: Project = Project(
    "root",
    file("."),
    settings = buildSettings
  ) aggregate(macros, supler)

  lazy val macros: Project = Project(
    "macros",
    file("macros"),
    settings = buildSettings ++ Seq(
      libraryDependencies <+= (scalaVersion)("org.scala-lang" % "scala-compiler" % _))
  )

  lazy val supler: Project = Project(
    "supler",
    file("supler"),
    settings = buildSettings ++ Seq(
      libraryDependencies += scalaTest
    )
  ) dependsOn(macros)
}