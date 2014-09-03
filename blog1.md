Introducing Supler: a Functional Reactive Form Library
===

Let's face it. Creating websites with complex forms is a pain. Writing the HTML in the frontend, the supporting
javascript, defining mappings in the backed, server-side validation, and - let's not forget, it's 2014 - corresponding
client-side validation, cause a lot of duplication of code and effort, and result in frustration. 

There's quite a lot of frameworks offering end-to-end solutions to the problem, most often generating whole pages
on the server. However, using them usually ends in even more pain. The generated HTML and Javascript is hard to 
customize and extend with custom bindings. You end up being constrained with what the framework authors envisioned.

That's where Supler comes in. It's a **library**, with a very focused set of functionality:

* Scala DSL for defining forms based on a backing class (with validation)
* generating a JSON description of the form
* generating HTML basing on the JSON form description
* serializing a form to JSON and applying the values on the backend
* running client-side validations, for supported validations
* running server-side validations, and showing the results to the client

As important as Supler's features, are its non-features. Supler **does not** define or manage: 

* what web framework you use
* how is the JSON data served
* how you write your JavaScript
* the lifecycle of the entities on the backend
* the lifecycle of the data on the frontend
* if and what ORM you use
* how are your entities defined on the backend

Looks interesting? You can find the sources [on GitHub](https://github.com/softwaremill/supler). Give us a star if
you'd like to see Supler developed further.

Demo
---

But, to the important parts - how does Supler look in action? You can see a [live demo here](???). Try to remove some
values, enter incorrect values, submit the form, refresh the page. A more detailed description of how the code works
is below.
 
First, we need to define the form on the backend. Here you can see the model classes; three simple case classes:

````
case class Person(
  firstName: String, lastName: String, age: Int,
  address1: Option[String], address2: Option[String],
  gender: String, cars: List[Car], legoSets: List[LegoSet])   

case class Car(make: String, year: Int)

case class LegoSet(name: String, theme: String, number: Int, age: Int)
````

Next, we can use Supler's DSL to define forms for editing `Car`s and `LegoSet`s:

````
val carForm = form[Car](f => List(
  f.field(_.make).use(dataProvider(_ => List("Ford", "Toyota", "Mondeo", "Transit"))).label("Make"),
  f.field(_.year).validate(gt(1900)).label("Year")
))

val legoSetForm = form[LegoSet](f => List(
  f.field(_.name).label("Name"),
  f.field(_.theme).label("Theme").use(dataProvider(_ => List("City", "Technic", "Duplo", "Space", "Friends", "Universal"))),
  f.field(_.number).label("Set number").validate(lt(100000)),
  f.field(_.age).label("Age").validate(ge(0), le(50))
))
````

As you can see, a form is a list of fields. Each field is defined using a type-safe closure, with an optional label,
select options, and validation rules (which will be run both on the frontend, and backend).

We can now define a form for `Person`s, re-using the previously defined forms:
 
````
val personForm = form[Person](f => List(
  f.field(_.firstName).label("First name"),
  f.field(_.lastName).label("Last name")
    .validate(custom((e, v) => v.length <= e.firstName.length, (e, v) => ValidationError("Last name must be longer than first name!"))),
  f.field(_.age).label("Age"),
  f.field(_.address1).label("Address 1"),
  f.field(_.address2).label("Address 2"),
  f.field(_.gender).label("Gender").use(dataProvider(_ => List("Male", "Female"))),
  f.subform(_.cars, carForm, Car(null, 0)).label("Cars").renderHint(asList()),
  f.subform(_.legoSets, legoSetForm, LegoSet(null, null, 0, 0)).label("Lego sets")
))
````

In addition to the previous definitions, here we have a custom validation rule, which will be run on the backend only -
no translation to JavaScript is provided. Apart from simple fields, this form also contains two subforms - for lists
of a person's cars and Lego sets. The default rendering of a subform list is a table; an alternative is a list of forms,
which is used for cars. 

And that's it for the backend part. How you serve the JSON is entirely up to you. In our 
[demo server](https://github.com/softwaremill/supler/blob/master/examples/src/main/scala/org/supler/demo/DemoServer.scala) 
we use [spray.io](http://spray.io/) for HTTP part, but it can be any web framework.

Now, the frontend. We need to designate a place, where our form will be rendered. A simple `div` will suffice. We also
need a submit button and some placeholder for feedback:

````
<div>
  <div id="form-container"></div> 
  <a href="#" class="btn btn-primary btn-lg" id="submit" role="button">Submit</a>
  <p id="feedback"></p>
</div>
````

Next, when the page loads and we obtain the JSON description of the form (e.g. via a simple ajax call), we create a 
`SuplerForm` instance and instruct it to create and render the form:

````
var formContainer = document.getElementById('form-container');
var form =  = new SuplerForm(formContainer, {});
form.render(formJson);
````

And finally, we need some JavaScript to call the correct methods; here I'm using JQuery to send the data to the server
and handle the response:

````
$('#submit').click(function() {
  var hasErrors = form.validate();

  if (hasErrors) {
    feedback.html('There are client-side validation errors.');
    feedback.show();
  } else {
    $.ajax({
      url: '/rest/form1.json',
      type: 'POST',
      data: JSON.stringify(form.getValue()),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        if (form.processServerValidationErrors(data.validation_errors)) {
          feedback.html('There are server-side validation errors');
        } else {
          feedback.html(data.msg);
        }
        
        feedback.show();
      }
    });
  }

  return false;
});
````

Remember that `form` is an instance of the `SuplerForm` class. Upon an invocation of `validate()`, client-side
validations are run, and incorrect fields are marked as such. If there are no errors, the form is submitted, and
depending if server-side errors where returned or not, they are applied to the form, or a success message is shown.

The full sources are in the 
[example subproject](https://github.com/softwaremill/supler/tree/master/examples/src/main/resources)
of the Supler codebase.

Other important Supler traits
---

An important note, is that both `Form` and `Field` instances in Suple are re-useable and composable: you can compose
a form of previously defined fields and forms; you can also have stand-alone field definitions.

The generated HTML has a simple structure and predictable naming, following 1-1 what's in the form definition. Hence
it's easy to lookup a form element or form section generated by Supler and further customize it, either by adding
styling, or additional client-side JavaScript logic.

It is also possible to customize the rendering process and influence how all parts of the HTML are rendered by
providing custom render functions. Individual HTML tags, depending on type, templates of rendering a field, and more,
can be overriden.

What's next?
---

What you can see currently is only the beginning for what we have in mind for Supler. A rough list of the features 
that we hope will form the future Supler 1.0:

* customization of form rendering via HTML snippets
* dynamically re-rendering form parts basing on user input
* support for all kinds of form controls
* i18n support
* server-side value conversion

If Supler looks interesting to you, let us know by [starring the project](https://github.com/softwaremill/supler)!