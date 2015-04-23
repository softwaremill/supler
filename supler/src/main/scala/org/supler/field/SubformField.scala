package org.supler.field

import org.json4s.JsonAST.JValue
import org.json4s._
import org.supler.validation._
import org.supler.{FieldPath, Form, Id, Util}

case class SubformField[T, ContU, U, Cont[_]](
                                               c: SubformContainer[ContU, U, Cont],
                                               name: String,
                                               read: (T) => Cont[U],
                                               write: (T, Cont[U]) => T,
                                               label: Option[String],
                                               description: Option[String],
                                               embeddedForm: T => Form[U],
                                               createEmpty: Option[() => U],
                                               renderHint: RenderHint with SubformFieldCompatible,
                                               enabledIf: (T) => Boolean,
                                               includeIf: (T) => Boolean,
                                               lazyForm: Boolean = false) extends Field[T] {

  import c._

  def label(newLabel: String): SubformField[T, ContU, U, Cont] = this.copy(label = Some(newLabel))

  def description(newDescription: String): SubformField[T, ContU, U, Cont] = this.copy(description = Some(newDescription))

  def renderHint(newRenderHint: RenderHint with SubformFieldCompatible): SubformField[T, ContU, U, Cont] = this.copy(renderHint = newRenderHint)

  def enabledIf(condition: T => Boolean): SubformField[T, ContU, U, Cont] = this.copy(enabledIf = condition)

  def includeIf(condition: T => Boolean): SubformField[T, ContU, U, Cont] = this.copy(includeIf = condition)

  def lazyForm(newLazyForm: Boolean): SubformField[T, ContU, U, Cont] = this.copy(lazyForm = newLazyForm)

  private[supler] def generateFieldJSON(parentPath: FieldPath, obj: T) = {
    lazyForm match {
      case false => {
        val valuesAsJValue = read(obj).zipWithIndex.map { case (v, indexOpt) =>
          embeddedForm(obj).generateJSON(pathWithOptionalIndex(parentPath, indexOpt), v)
        }
        import JSONFieldNames._
        JObject(
          JField(Type, JString(SpecialFieldTypes.Subform)),
          JField(Evaluated, JBool(true)),
          JField(RenderHint, JObject(JField("name", JString(renderHint.name)) :: renderHint.extraJSON)),
          JField(Multiple, JBool(c.isMultiple)),
          JField(Label, JString(label.getOrElse(""))),
          JField(Path, JString(parentPath.append(name).toString)),
          JField(Value, c.combineJValues(valuesAsJValue))
        )
      }
      case true => {
        import JSONFieldNames._
        JObject(
          JField(Type, JString(SpecialFieldTypes.Subform)),
          JField(Evaluated, JBool(false))
        )
      }
    }
  }

  override private[supler] def applyFieldJSONValues(parentPath: FieldPath, obj: T, jsonFields: Map[String, JValue]): PartiallyAppliedObj[T] = {
    def valuesWithIndex = c.valuesWithIndexFromJSON(jsonFields.get(name))
    val paos = valuesWithIndex.map { case (formJValue, indexOpt) => {
      val embForm = embeddedForm(obj)
      embForm.applyJSONValues(pathWithOptionalIndex(parentPath, indexOpt),
        createEmpty.getOrElse(embForm.createEmpty)(), formJValue)
    }
    }

    c.combinePaos(paos).map(write(obj, _))
  }

  override private[supler] def doValidate(parentPath: FieldPath, obj: T, scope: ValidationScope) = {
    val valuesWithIndex = read(obj).zipWithIndex

    val errorLists = valuesWithIndex.map { case (el, indexOpt) =>
      embeddedForm(obj).doValidate(pathWithOptionalIndex(parentPath, indexOpt), el, scope)
    }

    errorLists.toList.flatten
  }

  override private[supler] def findAction(
                                           parentPath: FieldPath,
                                           obj: T,
                                           jsonFields: Map[String, JValue],
                                           ctx: RunActionContext) = {

    val values = read(obj)
    val valuesList = read(obj).toList
    val jvaluesWithIndex = c.valuesWithIndexFromJSON(jsonFields.get(name)).toList

    val valuesJValuesIndex = valuesList.zip(jvaluesWithIndex)

    Util
      .findFirstMapped[(U, (JValue, Option[Int])), Option[RunnableAction]](valuesJValuesIndex, { case (v, (jvalue, indexOpt)) =>
      val i = indexOpt.getOrElse(0)
      val updatedCtx = ctx.push(obj, i, (v: U) => write(obj, values.update(v, i)))
      // assuming that the values matches the json (that is, that the json values were previously applied)
      embeddedForm(obj).findAction(pathWithOptionalIndex(parentPath, indexOpt), valuesList(i), jvalue, updatedCtx)
    },
    _.isDefined).flatten
  }

  private def pathWithOptionalIndex(parentPath: FieldPath, indexOpt: Option[Int]) = indexOpt match {
    case None => parentPath.append(name)
    case Some(i) => parentPath.appendWithIndex(name, i)
  }
}

/**
 * The three type parameters are needed to extract the container type from the value. This is a bit more complicated
 * as we also want to support values without a container, then we need to artificially add the `Id` container.
 * @tparam ContU Container applied to a type. The type only serves as an example and doesn't matter.
 * @tparam U Example type to which the container is applied
 * @tparam Cont Type of the container
 */
trait SubformContainer[ContU, U, Cont[_]] {
  // operations on any value type
  def map[R, S](c: Cont[R])(f: R => S): Cont[S]

  def toList[R](c: Cont[R]): List[R]

  def update[R](cont: Cont[R])(v: R, i: Int): Cont[R]

  def zipWithIndex[R](values: Cont[R]): Cont[(R, Option[Int])]

  implicit class ContainerOps[R](c: Cont[R]) {
    def map[S](f: R => S) = SubformContainer.this.map(c)(f)

    def toList = SubformContainer.this.toList(c)

    def update(v: R, i: Int) = SubformContainer.this.update(c)(v, i)

    def zipWithIndex = SubformContainer.this.zipWithIndex(c)
  }

  // operations on specific types
  def valuesWithIndexFromJSON(jvalue: Option[JValue]): Cont[(JValue, Option[Int])]

  def combineJValues(jvalues: Cont[JValue]): JValue

  def combinePaos[R](paosInCont: Cont[PartiallyAppliedObj[R]]): PartiallyAppliedObj[Cont[R]]

  def isMultiple: Boolean
}

object SubformContainer {
  implicit def singleSubformContainer[U]: SubformContainer[U, U, Id] = new SubformContainer[U, U, Id] {
    def map[R, S](c: R)(f: (R) => S) = f(c)

    def toList[R](c: R) = List(c)

    def update[R](cont: R)(v: R, i: Int) = v

    def zipWithIndex[R](values: R) = (values, None)

    def valuesWithIndexFromJSON(jvalue: Option[JValue]) = (jvalue.getOrElse(JNothing), None)

    def combineJValues(jvalues: JValue) = jvalues

    def combinePaos[R](paosInCont: PartiallyAppliedObj[R]) = paosInCont

    def isMultiple = false
  }

  implicit def optionSubformContainer[U]: SubformContainer[Option[U], U, Option] = new SubformContainer[Option[U], U, Option] {
    def map[R, S](c: Option[R])(f: (R) => S) = c.map(f)

    def toList[R](c: Option[R]) = c.toList

    def zipWithIndex[R](values: Option[R]) = values.map((_, None))

    def update[R](cont: Option[R])(v: R, i: Int) = Some(v)

    def valuesWithIndexFromJSON(jvalue: Option[JValue]) = jvalue.map((_, None))

    def combineJValues(jvalues: Option[JValue]) = jvalues.getOrElse(JNothing)

    def combinePaos[R](paosInCont: Option[PartiallyAppliedObj[R]]) = paosInCont match {
      case None => PartiallyAppliedObj.full(None)
      case Some(paos) => paos.map(Some(_))
    }

    def isMultiple = false
  }

  implicit def listSubformContainer[U]: SubformContainer[List[U], U, List] = new SubformContainer[List[U], U, List] {
    def map[R, S](c: List[R])(f: (R) => S) = c.map(f)

    def toList[R](c: List[R]) = c

    def zipWithIndex[R](values: List[R]) = values.zipWithIndex.map { case (v, i) => (v, Some(i))}

    def update[R](cont: List[R])(v: R, i: Int) = cont.updated(i, v)

    def valuesWithIndexFromJSON(jvalue: Option[JValue]) = jvalue match {
      case Some(JArray(jvalues)) => jvalues.zipWithIndex.map { case (v, i) => (v, Some(i))}
      case _ => Nil
    }

    def combineJValues(jvalues: List[JValue]) = JArray(jvalues)

    def combinePaos[R](paosInCont: List[PartiallyAppliedObj[R]]) = PartiallyAppliedObj.flatten(paosInCont)

    def isMultiple = true
  }

  implicit def vectorSubformContainer[U]: SubformContainer[Vector[U], U, Vector] = new SubformContainer[Vector[U], U, Vector] {
    def map[R, S](c: Vector[R])(f: (R) => S) = c.map(f)

    def toList[R](c: Vector[R]) = c.toList

    def zipWithIndex[R](values: Vector[R]) = values.zipWithIndex.map { case (v, i) => (v, Some(i))}

    def update[R](cont: Vector[R])(v: R, i: Int) = cont.updated(i, v)

    def valuesWithIndexFromJSON(jvalue: Option[JValue]) = jvalue match {
      case Some(JArray(jvalues)) => jvalues.zipWithIndex.toVector.map { case (v, i) => (v, Some(i))}
      case _ => Vector.empty
    }

    def combineJValues(jvalues: Vector[JValue]) = JArray(jvalues.toList)

    def combinePaos[R](paosInCont: Vector[PartiallyAppliedObj[R]]) = PartiallyAppliedObj.flatten(paosInCont.toList).map(_.toVector)

    def isMultiple = true
  }
}