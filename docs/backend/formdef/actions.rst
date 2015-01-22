Form definition: Actions
========================

Forms can contain buttons which invoke actions on the server side (see also the section on reloading the form below).
Each action must have a unique name (fields also have names, but they are automatically inferred). An action name can
only contain letters, digits and _ (no spaces or other characters which would form an invalid JSON object key).

In its simplest form, an action can modify the object that is backing the form, and needs to return an `ActionResult`::

  case class Person(name: String)
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.action("duplicateName")(p => ActionResult(p.copy(name = s"${p.name} ${p.name}"))
      .label("Duplicate name")
  ))

Actions can result not only in modified objects, but also return some custom data (JSON) to the client. You can either
return both an object and custom data using ``ActionResult(obj, Some(jvalue))``, or only custom data using
``ActionResult.custom(jvalue)``. Depending on the variant, when the JSON is generated, the custom data will be placed
next to the form data, or will replace the whole generated JSON.

To implement some operations on subforms, such as removing a subform element, or moving the elements around, it is
necessary to have access to the parent object. This is possible by using ``parentAction``s. The subform is in such
case parametrised by the action (so it can be reused in different contexts), which is provided in the parent form::

  case class Address(street: String)
  case class Person(name: String, addresses: List[Address]) {
    def removeAddress(a: Address) = this.copy(addresses = this.addresses diff List(a))
  }
  
  def addressForm(removeAction: Address => ActionResult[Address]) = form[Address](f => List(
    f.field(_.street).label("Street"),
    f.action("remove")(removeAction).label("Remove")
  ))
  
  val personForm = form[Person](f => List(
    f.field(_.name).label("Name"),
    f.subform(_.addresses, addressForm(
      f.parentAction((person, index, address) => ActionResult(person.removeAddress(address)))))
      .label("Addresses")
  ))
