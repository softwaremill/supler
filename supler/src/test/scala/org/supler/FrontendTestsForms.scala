package org.supler

import java.io.{File, PrintWriter}

import org.json4s.JsonAST._
import org.json4s.native.JsonMethods._
import org.json4s.native.Serialization
import org.json4s.{Extraction, NoTypeHints}
import org.scalatest._
import org.supler.Supler._
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
  case class SimpleSingleField(f1: String)
  case class Simple1(field1: String, field2: Option[String], field3: Int, field4: Boolean)
  case class ComplexSubformsList(field10: String, simples: List[Simple1])
  case class ComplexSingleSubform(field10: String, simple: Simple1)
  case class ComplexOptionalSubform(field10: String, simple: Option[Simple1])
}

class FrontendTestsForms extends FlatSpec with ShouldMatchers {
  val testClassesDir = new File(this.getClass.getProtectionDomain.getCodeSource.getLocation.toURI)

  import org.supler.FrontendTestsForms._

  val simple1Form = form[Simple1](f => List(
    f.field(_.field1).label("Field 1"),
    f.field(_.field2).label("Field 2"),
    f.field(_.field3).label("Field 3").validate(gt(10)),
    f.field(_.field4).label("Field 4")
  ))

  writeTestData("simple1") { writer =>
    val simpleObj1 = Simple1("v1", Some("v2"), 12, field4 = true)
    val simpleObj2 = Simple1("v1", None, 15, field4 = true)
    val simpleObj3Invalid = Simple1("v1", None, 0, field4 = true)

    writer.writeForm("form1", simple1Form, simpleObj1)

    writer.writeForm("form2", simple1Form, simpleObj2)

    writer.writeForm("form3invalid", simple1Form, simpleObj3Invalid)
    writer.writeValidatedForm("form3invalidValidated", simple1Form, simpleObj3Invalid)

    writer.writeObj("obj1", simpleObj1, Meta(Map()).addMeta("entityId", "987"))
    writer.writeObj("obj2", simpleObj2, Meta(Map()).addMeta("entityId", "987"))
    writer.writeObj("obj3invalid", simpleObj3Invalid, Meta(Map()).addMeta("entityId", "987"))
  }

  writeTestData("actionSimple") { writer =>
    val obj1 = SimpleSingleField("z")
    val obj2 = SimpleSingleField("u")

    val fOneActionValidateNone = form[SimpleSingleField](f => List(
      f.field(_.f1).label("Field 1"),
      f.action("addx") { s => ActionResult(s.copy(f1 = s.f1 + "x")) }
    ))

    val fTwoActionsOneValidateAll = form[SimpleSingleField](f => List(
      f.field(_.f1).label("Field 1"),
      f.action("addx") { s => ActionResult(s.copy(f1 = s.f1 + "x")) },
      f.action("addy") { s => ActionResult(s.copy(f1 = s.f1 + "y")) }.validateAll()
    ))

    val fActionFormAndDataResult = form[SimpleSingleField](f => List(
      f.field(_.f1).label("Field 1"),
      f.action("act") { s => ActionResult(s.copy(f1 = s.f1 + "x"), customData = Some(JString("data and form"))) }
    ))

    val fActionDataResultOnly = form[SimpleSingleField](f => List(
      f.field(_.f1).label("Field 1"),
      f.action("act") { s => ActionResult.custom(JString("data only")) }
    ))

    writer.writeForm("formOneActionValidateNone", fOneActionValidateNone, obj1)
    writer.writeForm("formOneActionValidateNone2", fOneActionValidateNone, obj2)

    writer.writeForm("formTwoActionsOneValidateAll", fTwoActionsOneValidateAll, obj1)

    writer.writeFormAfterAction("formAfterActionFormAndData", fActionFormAndDataResult, obj1, "act")
    writer.writeFormAfterAction("formAfterActionDataOnly", fActionDataResultOnly, obj1, "act")
  }

  writeTestData("selectSingle") { writer =>
    case class SelectSingleRequired(field1: String)
    case class SelectSingleOptional(field1: Option[String])

    val fReq = form[SelectSingleRequired](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c"))
    ))

    val fReqRadio = form[SelectSingleRequired](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c")).renderHint(asRadio())
    ))

    val fOpt = form[SelectSingleOptional](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c").map(Some(_)))
    ))

    val fOptRadio = form[SelectSingleOptional](f => List(
      f.field(_.field1).label("Field 1").possibleValues(_ => List("a", "b", "c").map(Some(_))).renderHint(asRadio())
    ))

    val obj1req = SelectSingleRequired("b")
    val obj2req = SelectSingleRequired("")

    val obj1opt = SelectSingleOptional(Some("b"))
    val obj2opt = SelectSingleOptional(None)

    writer.writeForm("form1req", fReq, obj1req)
    writer.writeForm("form2req", fReq, obj2req)
    writer.writeForm("form1reqRadio", fReqRadio, obj1req)
    writer.writeForm("form2reqRadio", fReqRadio, obj2req)
    writer.writeForm("form1opt", fOpt, obj1opt)
    writer.writeForm("form2opt", fOpt, obj2opt)
    writer.writeForm("form1optRadio", fOptRadio, obj1opt)
    writer.writeForm("form2optRadio", fOptRadio, obj2opt)
  }
  
  writeTestData("complexSubformsList") { writer =>
    val complexFormTable = form[ComplexSubformsList](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simples, simple1Form).renderHint(asTable())
    ))
    val complexFormList = form[ComplexSubformsList](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simples, simple1Form).renderHint(asList())
    ))

    val objNonEmpty = ComplexSubformsList("c1", List(
      Simple1("f11", Some("x"), 11, field4 = true),
      Simple1("f12", Some("y"), 12, field4 = false),
      Simple1("f13", Some("z"), 13, field4 = true)))
    val objEmpty = ComplexSubformsList("c1", Nil)

    writer.writeForm("formTableNonEmpty", complexFormTable, objNonEmpty)
    writer.writeForm("formTableEmpty", complexFormTable, objEmpty)

    writer.writeForm("formListNonEmpty", complexFormList, objNonEmpty)
    writer.writeForm("formListEmpty", complexFormList, objEmpty)

    writer.writeObj("objNonEmpty", objNonEmpty, Meta(Map()).addMeta("entityId", "987"))
  }

  writeTestData("complexSingleSubform") { writer =>
    val complexForm1 = form[ComplexSingleSubform](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simple, simple1Form)
    ))

    val obj1 = ComplexSingleSubform("c1", Simple1("f11", Some("x"), 11, field4 = true))

    writer.writeForm("form1", complexForm1, obj1)

    writer.writeObj("obj1", obj1, Meta(Map()).addMeta("entityId", "987"))
  }

  writeTestData("complexOptionalSubform") { writer =>
    val complexForm1 = form[ComplexOptionalSubform](f => List(
      f.field(_.field10).label("Field 10"),
      f.subform(_.simple, simple1Form)
    ))

    val objSome = ComplexOptionalSubform("c1", Some(Simple1("f11", Some("x"), 11, field4 = true)))
    val objNone = ComplexOptionalSubform("c1", None)

    writer.writeForm("formSome", complexForm1, objSome)
    writer.writeForm("formNone", complexForm1, objNone)

    writer.writeObj("objSome", objSome, Meta(Map()).addMeta("entityId", "987"))
    writer.writeObj("objNone", objNone, Meta(Map()).addMeta("entityId", "987"))
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

  writeTestData("validateIfDefinedOpt") { writer =>
    case class StringOptData(f: Option[String])
    case class IntOptData(f: Option[Int])

    val stringOptForm = form[StringOptData](f => List(f.field(_.f).validate(ifDefined(minLength(5)))))
    val intOptForm = form[IntOptData](f => List(f.field(_.f).validate(ifDefined(lt(10)))))

    writer.writeForm("stringOkSome", stringOptForm, StringOptData(Some("abcdefghij")))
    writer.writeForm("stringOkNone", stringOptForm, StringOptData(None))
    writer.writeForm("stringError", stringOptForm, StringOptData(Some("abc")))

    writer.writeForm("intOkSome", intOptForm, IntOptData(Some(8)))
    writer.writeForm("intOkNone", intOptForm, IntOptData(None))
    writer.writeForm("intError", intOptForm, IntOptData(Some(20)))
  }

  writeTestData("validateNumbers") { writer =>
    case class Data(f1: Int, f2: Long, f3: Float, f4: Double)

    val validateNumbersForm = form[Data](f => List(
      f.field(_.f1).validate(ge(10)),
      f.field(_.f2).validate(ge(10L)),
      f.field(_.f3).validate(ge(10.2f)),
      f.field(_.f4).validate(ge(10.2d))
    ))

    writer.writeForm("formOk", validateNumbersForm, Data(20, 20L, 10.3f, 10.3d))
    writer.writeForm("formError", validateNumbersForm, Data(2, 2L, 10.1f, 10.1d))
  }

  writeTestData("optionalInt") { writer =>
    case class IntOptData(f1: String, f2: Option[Int])

    val intOptForm = form[IntOptData](f => List(
      f.field(_.f1).label("Field 1"),
      f.field(_.f2).label("Field 2")
    ))

    writer.writeForm("formIntSome", intOptForm, IntOptData("a", Some(8)))
    writer.writeForm("formIntNone", intOptForm, IntOptData("b", None))
  }

  def writeTestData(name: String)(thunk: JsonWriter => Unit): Unit = {
    it should s"write forms & jsons: $name" in {
      val file = new File(testClassesDir, s"$name.js")
      println("Writing to file: " + file.getPath)
      val pw = new PrintWriter(file)
      try {
        pw.write("var data = data || {};\n")
        pw.write(s"data.$name = {")
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
      val toWrite = pretty(render(form(obj).withMeta("entityId", "987").generateJSON))
      pw.println( s""""$variableName": $toWrite,""")
    }

    def writeValidatedForm[T](variableName: String, form: Form[T], obj: T): Unit = {
      val toWrite = pretty(render(form(obj).doValidate().generateJSON))
      pw.println( s""""$variableName": $toWrite,""")
    }

    def writeObj(variableName: String, obj: AnyRef, meta: Meta = Meta(Map())): Unit = {
      val withMeta = Extraction.decompose(obj) match {
        case JObject(fields) => JObject(meta.toJSON :: fields)
        case _ => throw new RuntimeException(s"Got some weird unexpected object: $obj")
      }
      pw.println( s""""$variableName": ${pretty(render(withMeta))},""")
    }

    def writeFormAfterAction[T](variableName: String, form: Form[T], obj: T, actionFieldName: String): Unit = {
      val JObject(fields) = Extraction.decompose(obj)
      val actionField = JField(actionFieldName, JBool(value = true))
      val toWrite = pretty(render(form(obj).process(JObject(fields :+ actionField)).generateJSON))
      pw.println( s""""$variableName": $toWrite,""")
    }
  }
}
