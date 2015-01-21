Form definition: Validation
===========================

Another useful customization of fields is specifying validators. There's a number of built-in validators, but you can also specify custom ones. Validators have access to the value of the field and the whole object::

  val personForm = form[Person](f => List(
    f.field(_.firstName).label("First name")
      .validate(custom((e, v) => v.startsWith("A"), (e, v) => ErrorMessage("First name cannot start with an 'A'!"))),
    f.field(_.lastName).label("Last name"),
    f.field(_.age).label("Age").validate(ge(0), le(120))
  ))

The built-in validators include a JSON representation, and they will be checked both on the client and server side. Custom validators by default are checked only on the server, but it is possible to provide a JSON representation as well.

You can validate any object at any time using the ``doValidate`` method, which returns an optional list of validation errors found (the object doesn't have to come from the Supler-frontend)::

  val validationErrors: Option[FormErrors] = personForm.doValidate(Person("Adam", "Smith", 18))
