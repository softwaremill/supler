package org.supler

import java.io.{File, PrintWriter}

import org.json4s.JsonAST.{JString, JField, JBool, JObject}
import org.json4s.{Extraction, NoTypeHints}
import org.json4s.native.Serialization
import org.scalatest._
import org.supler.Supler._
import org.json4s.native.JsonMethods._
import org.supler.field.ActionResult

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
  case class Complex1(field10: String, simples: List[Simple1])
  case class Complex2(field10: String, simple: Simple1)
  case class Complex3(field10: String, simple: Option[Simple1])
}

class FrontendTestsForms extends FlatSpec with ShouldMatchers {
  val testClassesDir = new File(this.getClass.getProtectionDomain.getCodeSource.getLocation.toURI)

  import FrontendTestsForms._

  val simple1Form = form[Simple1](f => List(
    f.field(_.field1).label("Field 1"),
    f.field(_.field2).label("Field 2"),
    f.field(_.field3).label("Field 3").validate(gt(10)),
    f.field(_.field4).label("Field 4")
  ))

  val simpleObj1 = Simple1("v1", Some("v2"), 0, field4 = true)
  val simpleObj2 = Simple1("v1", None, 15, field4 = true)
  
  writeTestData("simple1") { writer =>
    writer.writeForm("form1", simple1Form, simpleObj1)
    writer.writeValidatedForm("form1validated", simple1Form, simpleObj1)

    writer.writeForm("form2", simple1Form, simpleObj2)

    writer.writeObj("obj1", simpleObj1)
    writer.writeObj("obj2", simpleObj2)
  }

  writeTestData("simple1action") { writer =>
    val fAction = form[Simple1](f => List(
      f.field(_.field3).label("Field 3"),
      f.action("inc") { s => ActionResult(s.copy(field3 = s.field3 + 1)) }
    ))

    val fTwoActions = form[Simple1](f => List(
      f.field(_.field1).label("Field 1"),
      f.action("inc") { s => ActionResult(s.copy(field1 = s.field1 + "x")) },
      f.action("save") { s => ActionResult(s.copy(field1 = s.field1 + "y")) }.validateAll()
    ))

    val fActionFormAndDataResult = form[Simple1](f => List(
      f.field(_.field3).label("Field 3"),
      f.action("act") { s => ActionResult(s.copy(field3 = s.field3 + 1), customData = Some(JString("data and form"))) }
    ))

    val fActionDataResultOnly = form[Simple1](f => List(
      f.field(_.field3).label("Field 3"),
      f.action("act") { s => ActionResult.custom(JString("data only")) }
    ))

    writer.writeForm("form1", fAction, simpleObj1)
    writer.writeForm("form2", fAction, simpleObj2)

    writer.writeForm("form1two", fTwoActions, simpleObj1)

    writer.writeFormAfterAction("form1formAndData", fActionFormAndDataResult, simpleObj1, "act")
    writer.writeFormAfterAction("form1dataOnly", fActionDataResultOnly, simpleObj1, "act")
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
  
  writeTestData("complex1") { writer =>
    val complexForm1 = form[Complex1](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simples, simple1Form).renderHint(asTable())
    ))
    val complexForm2 = form[Complex1](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simples, simple1Form).renderHint(asList())
    ))

    val obj1 = Complex1("c1", List(
      Simple1("f11", Some("x"), 11, field4 = true),
      Simple1("f12", Some("y"), 12, field4 = false),
      Simple1("f13", Some("z"), 13, field4 = true)))
    val obj2 = Complex1("c1", Nil)

    writer.writeForm("form1table", complexForm1, obj1)
    writer.writeForm("form2table", complexForm1, obj2)

    writer.writeForm("form1list", complexForm2, obj1)
    writer.writeForm("form2list", complexForm2, obj2)

    writer.writeObj("obj1", obj1)
  }

  writeTestData("complex2") { writer =>
    val complexForm1 = form[Complex2](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simple, simple1Form)
    ))

    val obj1 = Complex2("c1", Simple1("f11", Some("x"), 11, field4 = true))

    writer.writeForm("form1", complexForm1, obj1)

    writer.writeObj("obj1", obj1)
  }

  writeTestData("complex3") { writer =>
    val complexForm1 = form[Complex3](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simple, simple1Form)
    ))

    val obj1 = Complex3("c1", Some(Simple1("f11", Some("x"), 11, field4 = true)))
    val obj2 = Complex3("c1", None)

    writer.writeForm("form1", complexForm1, obj1)
    writer.writeForm("form2", complexForm1, obj2)

    writer.writeObj("obj1", obj1)
    writer.writeObj("obj2", obj2)
  }

  writeTestData("conditional") { writer =>
    case class ConditionalSimple(f1: String, f2: String)

    val simpleForm = form[ConditionalSimple](f => List(
      f.field(_.f1).label("Field 1").enabledIf(_.f2 == "v2"),
      f.field(_.f2).label("Field 2")
    ))

    case class ConditionalComplex(f1: String, f2: List[ConditionalSimple])

    val complexForm = form[ConditionalComplex](f => List(
      f.field(_.f1).label("Field 1"),
      f.subform(_.f2, simpleForm).label("Simples").enabledIf(_.f1 == "enabled")
    ))

    writer.writeForm("simpleFormEnabled", simpleForm, ConditionalSimple("v1", "v2"))
    writer.writeForm("simpleFormDisabled1", simpleForm, ConditionalSimple("v1", "v3"))
    writer.writeForm("simpleFormDisabled2", simpleForm, ConditionalSimple("", ""))

    writer.writeForm("complexFormDisabled", complexForm, ConditionalComplex("disabled", List(ConditionalSimple("v1", "v2"))))
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
    implicit val formats = Serialization.formats(NoTypeHints)

    def writeForm[T](variableName: String, form: Form[T], obj: T): Unit = {
      val toWrite = pretty(render(form(obj).generateJSON))
      pw.println(s""""$variableName": $toWrite,""")
    }

    def writeValidatedForm[T](variableName: String, form: Form[T], obj: T): Unit = {
      val toWrite = pretty(render(form(obj).doValidate().generateJSON))
      pw.println(s""""$variableName": $toWrite,""")
    }

    def writeObj(variableName: String, obj: AnyRef): Unit = {
      pw.println(s""""$variableName": ${Serialization.writePretty(obj)},""")
    }

    def writeFormAfterAction[T](variableName: String, form: Form[T], obj: T, actionFieldName: String): Unit = {
      val JObject(fields) = Extraction.decompose(obj)
      val actionField = JField(actionFieldName, JBool(value = true))
      val toWrite = pretty(render(form(obj).process(JObject(fields :+ actionField)).generateJSON))
      pw.println(s""""$variableName": $toWrite,""")
    }
  }
}
