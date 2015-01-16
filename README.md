# supler - Functional Reactive Form Library

[![Build Status](https://travis-ci.org/softwaremill/supler.svg?branch=master)](https://travis-ci.org/softwaremill/supler)

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
* running server-side actions
* applying values sent from the frontend to the backing object

On the frontend side Supler provides:

* generating HTML basing on JSON form description
* serializing a form to JSON
* running client-side validations
* customizability of the HTML generation process
* automatically refresh the form with server-side changes after a field is edited

## Supler diagram

![Supler diagram](https://raw.githubusercontent.com/softwaremill/supler/master/design/supler%20diagram.png)

## Using Supler

As Supler has two parts, they are deployed in different repositories. The backend can be found in
[Sonatype’s OSS repository](https://oss.sonatype.org/content/repositories/releases/com/softwaremill/supler_2.11/),
and if you have e.g. an SBT build you just need to add:

````scala
libraryDependencies += "com.softwaremill" %% "supler" % "0.1.0"
````

The frontend is deployed to [Bower](http://bower.io/search/?q=supler), and you can install it simply using
`bower install supler`. Or you can just grab `supler.js` directly from the
[GitHub tag](https://github.com/softwaremill/supler/blob/0.1.0/supler.js).

## Server-side

All examples assume that all members of the `Supler` objects are available in the current scope
(`import org.supler.Supler._`).

### Forms

You can use any object and class as the backing object for a Supler form. The fields of the class which are editable in
the form must be either `var`s, provide a Scala-style getter/setter, or immutable `val`s in a `case class`. We recommend
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
is your type, and `S` is one of the basic types. For convenience, you can extend `StringTransformer[U]` etc.

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
  f.subform(_.cars, carForm).label("Cars")
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

#### Label (static) fields

Fields can also be non-editable and display static content - a label. Note that the value of such fields will **not**
be included when the form is serialized on the frontend, and sent back to the server.

````scala
case class Person(name: String, registrationId: String)

val personForm = form[Person](f => List(
  f.field(_.name).label("Name"),
  f.staticField(_.registrationId).label("Registration id")
))
````

#### Actions

Forms can contain buttons which invoke actions on the server side (see also the section on reloading the form below).
Each action must have a unique name (just as fields have names, but these are inferred). An action name can only contain
letters, digits and _ (no spaces or other characters which would form an invalid JSON object key).

In its simplest form, an action can modify the object that is backing the form, and needs to return an `ActionResult`:

````scala
case class Person(name: String)

val personForm = form[Person](f => List(
  f.field(_.name).label("Name"),
  f.action("duplicateName")(p => ActionResult(p.copy(name = s"${p.name} ${p.name}"))
    .label("Duplicate name")
))
````

Actions can result not only in modified objects, but also return some custom data (JSON) to the client. You can either
return both an object and custom data using `ActionResult(obj, Some(jvalue))`, or only custom data using
`ActionResult.custom(jvalue)`. Depending on the variant, when the JSON is generated, the custom data will be next
to the form data, or will replace the whole generated JSON.

To implement some operations on subforms, such as removing a subform element, or moving the elements around, it is
needed to have access to the parent object. This is possible by using `parentAction`s. The subform is in such case
parametrised by the action (so it can be reused in different contexts), which is provided in the parent form:

````scala
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
val personFormJson = personForm(person).generateJSON
````

The resulting JSON can be then sent to the client. Supler uses the Scala-standard [json4s](https://github.com/json4s/json4s)
to generate the JSON.

The JSON contains both the form structure and the form values. It is a custom format, however it's very easy to
understand, and self-explanatory; the fields in the JSON correspond closely to the DSL-based definition.

### Applying values and validating

After receiving a JSON representing an updated state, the form can be used to apply the values
to an object:

````scala
personForm(person).applyValuesFromJSON(receivedJson)

// with validation:
personForm(person).applyValuesFromJSON(receivedJson).doValidate()
````

The resulting type of each method is a `FormWithObject[Person]`, which contains potential conversion/validation
errors and the current state of the object.

If there are errors, the json generated by `generateJSON` will contain them, and the errors will be displayed to the
client if the data is sent back to the client and rendered.

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

The resulting JSON is what you might expect, mirroring the form's structure through objects, JSON arrays, nested
objects and primitive types.

In fact, to apply a JSON to an object on the server-side you don't need to use Supler-frontend. Because there's nothing
special about the format, it is easy to generate such a JSON yourself.

### Handling server responses

When a modified form is received (potentially with conversion/validation errors), it can be rendered using the same
method: `SuplerForm.render(refreshedFormJson)`.

### Customizing the rendering process

The rendering process is fully customizable. By default, [Bootstrap](http://getbootstrap.com/)-based HTML is rendered,
but this can be changed either by providing HTML templates, or by overriding any of the rendering functions
using the options.

For details, see the [readme on rendering customization](CUSTOMIZE_RENDER.md).

### i18n

Both the labels and the conversion/validation errors may be i18n keys. Some default keys are provided for the standard
validators, but custom ones can be provided as well simply by specifying them as keys in the options to `SuplerForm`:

````javascript
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {
  i18n: {
    error_custom_lastNameLongerThanFirstName: "Last name must be longer than first name!",
    error_custom_illegalDateFormat: function(detail) { return "Illegal date format: " + detail; }
  }
});
form.render(formJson); // formJson is received from the server
````

The values can be either strings, or functions which format the message using the error message's arguments.

### Updating the form basing on server-side form changes

The form can be automatically updated after each field edit (value change), and when actions are performed.
To do that, two things are necessary. First, a `send_form_function` option must be specified. This should be
a javascript function, accepting form representation (as a JS object) and callbacks for handling response and errors,
to be called when the backend responds with an updated form representation or if the request fails.
For example, when using JQuery, this can be:

````javascript
function sendForm(formValue, renderResponseFn, sendErrorFn, isAction, triggeringElement) {
    $.ajax({
        url: '/refresh_form.json',
        type: 'POST',
        data: JSON.stringify(formValue),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        success: renderResponseFn,
        error: sendErrorFn
    });
}
````

Secondly, we need to provide a server-side endpoint which will refresh the form with the given values, validate
and generate back the response. When validating, there is a special mode which runs the validations only for fields
with filled-in values, not to show the user validation errors for fields which haven't been yet edited at all.
This can be done with the convenience `personForm(person).process(receivedJson)` method. This invokes apply,
validate, run action and generate JSON in succession.

Concurrent sends are handled as well. Only the results of the last send triggered by value changes will be taken
into account. Only one action can be in progress at a time (hence errors must be reported using `sendErrorFn`).
It could be a good idea to block the UI while an action is executing, so that no form changes are made during action
execution (which would be lost). The `isAction` flag can be used to achieve that (there is usually no need to block
the UI for value-change refreshes).

### Adding custom behavior to the form

By setting the `after_render_function` option to a no-argument function, it is possible to get notified after a form
is rendered (or refreshed), and customize the form or add some custom dynamic behavior.

### Handling custom data

Actions can result in custom data being returned by the server. Custom data can come either together with a form, or
without. There are two ways to handle custom data. First, you can specify the `custom_data_handler` option, which
should be a function accepting the data object. The function will be invoked after rendering the form with `render`
(or calling the `renderResponseFn`).

The second way is to get the custom data by hand, using `SuplerForm.getCustomData(json)`, and if the result is not
null, handling it as desired.

## Version history

0.1.0 - 16/12/2014

* initial release

## Contributors

* [Tomasz Szymański](http://twitter.com/szimano)
* [Adam Warski](http://twitter.com/adamwarski)