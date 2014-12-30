package org.supler

import java.io.{File, PrintWriter}

import org.json4s.NoTypeHints
import org.json4s.native.Serialization
import org.scalatest._
import org.supler.Supler._
import org.json4s.native.JsonMethods._

/**
 * The frontend tests are run by grunt-mocha in a headless phantomjs browser.
 * The setup is:
 * 1. the supler-js project depends in SBT on supler
 * 2. when SBT tests are run, first the test below is executed
 * 3. `FrontendTestsForms` generates json form descriptions & json object representations which can be later used in
 * frontend tests (so that we don't have to setup a server and handle XHR requests)
 * 4. the generated files are copied with `grunt copy:testforms`
 * 5. `runner.html` includes all the generated data via `script` tags and then the tests
 */
object FrontendTestsForms {
  case class Simple1(field1: String, field2: Option[String], field3: Int, field4: Boolean)
  case class Select1Required(field1: String)
  case class Select1Optional(field1: Option[String])
}

class FrontendTestsForms extends FlatSpec with ShouldMatchers {
  val testClassesDir = new File(this.getClass.getProtectionDomain.getCodeSource.getLocation.toURI)

  import FrontendTestsForms._

  writeTestData("simple1") { writer =>
    val f = form[Simple1](f => List(
      f.field(_.field1).label("Field 1"),
      f.field(_.field2).label("Field 2"),
      f.field(_.field3).label("Field 3").validate(gt(10)),
      f.field(_.field4).label("Field 4")
    ))

    val obj1 = Simple1("v1", Some("v2"), 0, field4 = true)
    val obj2 = Simple1("v1", None, 15, field4 = true)

    writer.writeForm("form1", f, obj1)
    writer.writeValidatedForm("form1validated", f, obj1)

    writer.writeForm("form2", f, obj2)

    writer.writeObj("obj1", obj1)
    writer.writeObj("obj2", obj2)
  }

  writeTestData("select1") { writer =>
    val fReq = form[Select1Required](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c"))
    ))

    val fReqRadio = form[Select1Required](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c")).renderHint(asRadio())
    ))

    val fOpt = form[Select1Optional](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c").map(Some(_)))
    ))

    val fOptRadio = form[Select1Optional](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c").map(Some(_))).renderHint(asRadio())
    ))

    val obj1req = Select1Required("b")
    val obj2req = Select1Required("")

    val obj1opt = Select1Optional(Some("b"))
    val obj2opt = Select1Optional(None)

    writer.writeForm("form1req", fReq, obj1req)
    writer.writeForm("form2req", fReq, obj2req)
    writer.writeForm("form1reqRadio", fReqRadio, obj1req)
    writer.writeForm("form2reqRadio", fReqRadio, obj2req)
    writer.writeForm("form1opt", fOpt, obj1opt)
    writer.writeForm("form2opt", fOpt, obj2opt)
    writer.writeForm("form1optRadio", fOptRadio, obj1opt)
    writer.writeForm("form2optRadio", fOptRadio, obj2opt)
  }

  def writeTestData(name: String)(thunk: JsonWriter => Unit): Unit = {
    it should s"write forms & jsons: $name" in {
      val file = new File(testClassesDir, s"$name.js")
      println("Writing to file: " + file.getPath)
      val pw = new PrintWriter(file)
      try {
        pw.write(s"var $name = {")
        thunk(new JsonWriter(pw))
        pw.write("};")
      } finally {
        pw.close()
      }
    }
  }

  class JsonWriter(pw: PrintWriter) {
    def writeForm[T](variableName: String, form: Form[T], obj: T): Unit = {
      val toWrite = pretty(render(form(obj).generateJSON))
      pw.println(s""""$variableName": $toWrite,""")
    }

    def writeValidatedForm[T](variableName: String, form: Form[T], obj: T): Unit = {
      val toWrite = pretty(render(form(obj).doValidate().generateJSON))
      pw.println(s""""$variableName": $toWrite,""")
    }

    def writeObj(variableName: String, obj: AnyRef): Unit = {
      implicit val formats = Serialization.formats(NoTypeHints)
      pw.println(s""""$variableName": ${Serialization.writePretty(obj)},""")
    }
  }
}
