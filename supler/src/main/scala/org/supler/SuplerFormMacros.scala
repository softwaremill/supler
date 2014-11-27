package org.supler

import scala.reflect.macros.blackbox

object SuplerFormMacros {
  def form_impl[T: c.WeakTypeTag](c: blackbox.Context)
    (rows: c.Expr[Supler[T] => List[Row[T]]]): c.Expr[Form[T]] = {

    import c.universe._

    val targetTpe = implicitly[WeakTypeTag[T]].tpe
    val constructorOpt = targetTpe.members.find(m => m.isMethod && m.asMethod.isPrimaryConstructor)
    val empty = constructorOpt match {
      case None =>
        c.abort(c.enclosingPosition, "Cannot find constructor for " + targetTpe)
      case Some(targetConstructor) =>
        val targetConstructorParamLists = targetConstructor.asMethod.paramLists
        val TypeRef(_, sym, tpeArgs) = targetTpe
        var newT: Tree = Select(New(Ident(targetTpe.typeSymbol)), termNames.CONSTRUCTOR)

        for {
          targetConstructorParams <- targetConstructorParamLists
        } {
          val constructorParams: List[c.Tree] = for (param <- targetConstructorParams) yield {
            val pTpe = param.typeSignature.substituteTypes(sym.asClass.typeParams, tpeArgs)
            defaultForType(c)(pTpe).getOrElse(reify { null }).tree
          }

          newT = Apply(newT, constructorParams)
        }

        c.Expr(newT)
    }

    reify {
      Form(rows.splice(new Supler[T] {}), () => empty.splice)
    }
  }

  private def defaultForType(c: blackbox.Context)(tpe: c.universe.Type): Option[c.universe.Expr[_]] = {
    import c.universe._

    if (tpe <:< typeOf[Int]) return Some(reify { 0 })
    if (tpe <:< typeOf[Long]) return Some(reify { 0L })
    if (tpe <:< typeOf[Float]) return Some(reify { 0.0f })
    if (tpe <:< typeOf[Double]) return Some(reify { 0.0d })
    if (tpe <:< typeOf[String]) return Some(reify { "" })
    if (tpe <:< typeOf[Boolean]) return Some(reify { false })

    if (tpe <:< typeOf[Option[_]]) return Some(reify { None })
    if (tpe <:< typeOf[List[_]]) return Some(reify { Nil })
    if (tpe <:< typeOf[Set[_]]) return Some(reify { Set() })

    None
  }
}
