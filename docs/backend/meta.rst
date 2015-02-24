Backend: form with meta
=======================

In some cases you will find it useful to send some payload with the form that you should be able to extract before processing
the form with object.

One good example is sending an entity id of the object backing the form, so that on each POST you will be able to pull
it from the database and apply changes that came from the frontend.

Add meta on form creation
-------------------------

When creating the form use the withMeta syntax::

  case class Person(id: String, name: String)

  val personForm = form[Person](f => List(
    f.field(_.name).label("Name")
  ))

  personForm(person).withMeta("id", person.id).generateJSON


which will add the needed payload to the form.

Extract the meta on form posts
------------------------------

The meta can be later extracted on POST calls with::

  val id = personForm.getMeta(jsonBody)("id")
  val person = personDao.lookup(id)
  personForm(person).process(jsonBody).generateJSON


where jsonBody is the serialized object that comes from the frontend.