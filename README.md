# supler - Functional Reactive Form Library

## Links

* [the introduction blog](http://www.warski.org/blog/2014/09/introducing-supler-a-functional-reactive-form-library/)
* [the live demo](http://supler.softwaremill.com/)

## Introduction

Supler is a **library** which makes writing complex form easier. It has server-side (Scala) and client-side
(JavaScript) components.

Supler does not define or mandate how the objects/entities backing the forms should work, how are they persisted,
how are sessions managed or how you handle requests. It is also agnostic to other JS frameworks and libraries. The
generated HTML has elements with predictable names, which can be easily customized.

On the server side Supler provides:

* a DSL for defining forms
* a way to generate a JSON description of a form
* running server-side conversion and validation
* applying values sent from the frontend to the backing object

On the frontend side Supler provides:

* generating HTML basing on JSON form description
* serializing a form to HTML
* running client-side validations
* customizability of the HTML generation process

## Server-side

All examples assume that all members of the `Supler` objects are available in the current scope
(`import org.supler.Supler._`).

### Forms

You can use any object and class as the backing object for a Supler form. The fields of the class which are editable in
the form must be either `var`s, provide a Scala-style gett/setter, or immutable `val`s in a `case class`. We recommend
the latter, immutable approach.

A form consists of a list of fields belonging to a single class. Supler provides a convenience method, `form`, which
captures the class of the object once, and can be used to quickly build forms.
Here we are defining a form with three fields:

````scala
case class Person(firstName: String, lastName: String, age: Int)

val personForm = form[Person](f => List(
  f.field(_.firstName),
  f.field(_.lastName),
  f.field(_.age)
))
```

The fields can be further customized. Almost always you'll want to specify the label of a field'

````scala
f.field(_.firstName).label("First name")
```

The label can also be a key which will be looked up in the i18n component on the frontend.

#### Validation

Another useful customization of fields is specifying validators. There's a number of built-in validators, but you
can also specify custom ones. Validators have access to the value of the field and the whole object:

````scala
val personForm = form[Person](f => List(
  f.field(_.firstName).label("First name")
    .validate(custom((e, v) => v.startsWith("A"), (e, v) => ErrorMessage("First name cannot start with an 'A'!"))),
  f.field(_.lastName).label("Last name"),
  f.field(_.age).label("Age").validate(ge(0), le(120))
))
```

The built-in validators include a JSON representation, and they will be checked both on the client and server side.
Custom validators by default are checked only on the server, but it is possible to provide a JSON representation
as well.

You can validate any object at any time using the `doValidate` method, which returns an optional list of validation
errors found (the object doesn't have to come from the Supler-frontend):

````scala
val validationErrors: Option[FormErrors] = personForm.doValidate(Person("Adam", "Smith", 18))
```

#### Narrowing possible values

Very often a field can take a value from a restricted domain. In that case, it is possible to tell Supler what the
possible values for a field are. The values can depend on the object (can be different for each instance of a class):

````scala
case class Car(make: String, year: Int)

val carForm = form[Car](f => List(
  f.field(_.make).label("Make").possibleValues(c => List("Ford", "Toyota", "KIA", "Lada")),
  f.field(_.year).label("Year")
))
```

If a field specifies the list of possible values, it will be rendered by default as a dropdown.

#### Supported types, type transformers

#### Subforms

#### Collection-valued fields

#### Render hints

In some cases there are a couple possible rendering of a field. In such case, you can specify a render hint, which
will influence how the field is rendered.
It will also be possible to specify custom rendering (not yet implemented).

For example, to render a password field as a password:

````scala
case class Login(username: String, password: String)

val loginForm = form[Login](f => List(
  f.field(_.username).label("Username"),
  f.field(_.password).label("Password").renderHint(asPassword())
))
````

Supported render hints:

* for subforms: `asTable()` (default), `asList()`
* for text fields: `asPassword()`, `asTextarea(rows = 10)`
* for single-select fields: `asRadio()`

### Stand-alone fields

Fields can be created without a form.