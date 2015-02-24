Frontend: Serializing the form
==============================

To read the value of a form as a JSON object, simply use the ``Supler.Form.getValue()`` method. The resulting JSON can
be sent to the server for processing.

The resulting JSON is what you might expect, mirroring the form's structure through objects, JSON arrays, nested
objects and primitive types.

In fact, to apply a JSON to an object on the server-side you don't need to use Supler-frontend. Because there's
nothing special about the format, it is easy to generate such a JSON yourself.