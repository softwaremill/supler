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
````

The fields can be further customized. Almost always you'll want to specify the label of a field'

````scala
f.field(_.firstName).label("First name")
````

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
````

The built-in validators include a JSON representation, and they will be checked both on the client and server side.
Custom validators by default are checked only on the server, but it is possible to provide a JSON representation
as well.

You can validate any object at any time using the `doValidate` method, which returns an optional list of validation
errors found (the object doesn't have to come from the Supler-frontend):

````scala
val validationErrors: Option[FormErrors] = personForm.doValidate(Person("Adam", "Smith", 18))
````

#### Narrowing possible values

Very often a field can take a value from a restricted domain. In that case, it is possible to tell Supler what the
possible values for a field are. The values can depend on the object (can be different for each instance of a class):

````scala
case class Car(make: String, year: Int)

val carForm = form[Car](f => List(
  f.field(_.make).label("Make").possibleValues(c => List("Ford", "Toyota", "KIA", "Lada")),
  f.field(_.year).label("Year")
))
````

If a field specifies the list of possible values, it will be rendered by default as a dropdown.

#### Supported types, type transformers

Fields of basic types (`String`, `Int`, `Long`, `Float`, `Double` and `Boolean`) are supported out-of-the-box, and can
be directly edited in form fields.

If you have a more complex type, you need to provide an implicit implementation of a `Transformer[U, S]`, where `U`
is your type, and `S` is one of the basic types. For convenience, you can extend `StringTransfomer[U]` etc.

In the transformer, you need to implement a method which serializes your type to a basic type, and another method
which deserializes a basic type into your type, or returns a form error.

#### Subforms

Fields can also correspond to other forms. Already defined forms can be freely re-used multiple times (forms are
immutable).
Currently this is limited to a list of sub-objects/sub-forms.

````scala
case class Car(make: String, year: Int)
case class Person(name: String, cars: List[Var])

val carForm = ...

val personForm = form[Person](f => List(
  f.field(_.name).label("Name"),
  f.subform(_.cars, carForm, Car(null, 0)).label("Cars")
))
````

#### Collection-valued fields

Multi-valued fields of basic types are also supported.
Currently this is limited to sets, and rendered as checkboxes.

````scala
case class Person(name: String, favoriteColors: Set[String])

val personForm = form[Person](f => List(
  f.field(_.name).label("Name"),
  f.setField(_.favoriteColors).label("Favorite colors").possibleValues(_ => Set("red", "green", "blue", "black"))
))
````

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

#### Stand-alone fields

Fields can be created without a form, and later used to compose other forms. This may help to centralize the definition
of some common fields. For example:

````scala
case class Person(name: String, age: Int)

val nameField = field[Person, String](_.name).label("Name")
val ageField = field[Person, Int](_.age).label("Age").validate(gt(0), le(120))

val personForm = form(_ => List(nameField, ageField))
````

### Serializing a form to JSON

To generate a JSON representation of a form, simply call its `generateJSON` method, passing in an object, basing
on which a form will be generated:

````scala
val personFormJson = personForm.generateJSON(person)
````

The resulting JSON can be then sent to the client. Supler uses the Scala-standard [json4s](https://github.com/json4s/json4s)
to generate the JSON.

### Applying values and validating

After receiving a JSON representing an updated state, the form can be used to apply the values
to an object:

````scala
personForm.applyJSONValues(person, receivedJson)
// or
personForm.applyJSONValuesAndValidate(person, receivedJson)
````

The resulting type of each method is `Either[FormErrors, Person]`. The errors can result from conversion or validation.
In case of errors, they should be returned to the client.

## Client-side (frontend)

The frontend side has to load the form description, render it and later serialize and send the values back.
How the form is loaded from the server, what technology is used to transmit the JSON etc., is not handled by Supler
and can be done in any way.

### Rendering the form

At the minimum, you need a designated container on your page, where the form will be rendered, and when
the form JSON is available, use `SuplerForm`:

````html
<div>
  <div id="form-container"></div>
  <a href="#" class="btn btn-primary btn-lg" id="submit" role="button">Submit</a>
  <p id="feedback"></p>
</div>
````

````javascript
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {});
form.render(formJson); // formJson is received from the server
````

### Client-side validation

To perform and display client side validation, use the `SuplerForm.validate()` method. It will return `true` if
there are any validation errors.

Any existing errors will be cleared upon next invocation of `validate()`.

### Serializing the form

To read the value of a form as a JSON object, simply use the `SuplerForm.getValue()` method. The resulting JSON can be
sent to the server.

### Handling server responses

In case the server responds with a JSON describing server-side validation errors, you can show them by using
`SuplerForm.processServerFormErrors(jsonWithErrors)`.

### Customizing the rendering process

The rendering process is fully customizable. By default, [Bootstrap](http://getbootstrap.com/)-based HTML is rendered,
but this can be changed by overriding any of the rendering functions (and in default, by providing HTML templates).

To override how a particular form element is rendered, simply provide a method in the options passed to `SuplerForm`:

````javascript
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {
  renderStringField: function(label, id, validationId, name, value, options, compact) {
    return someHtml;
  }
});
form.render(formJson); // formJson is received from the server
````

### i18n

Both the labels and the conversion/validation errors may be i18n keys. Some default keys are provided for the standard
validators, but custom ones can be provided as well simply by specifying them as keys in the options to `SuplerForm`:

````javascript
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {
  error_custom_lastNameLongerThanFirstName: "Last name must be longer than first name!",
  error_custom_illegalDateFormat: function(detail) { return "Illegal date format: " + detail; }
});
form.render(formJson); // formJson is received from the server
````

The values can be either strings, or functions which format the message using the error message's arguments.