What is Supler?
===============

`Supler <https://github.com/softwaremill/supler>`_ is an open-source library which makes writing complex forms easier.
It has a server-side (Scala) and a client-side (JavaScript) component.

Writing your first Supler form is just :ref:`a link away <first>`!

On the server side Supler provides:

* a DSL for defining forms
* generating a JSON description of a form, reading values from a data object
* applying JSON, writing to a data object
* running server-side conversions and validations
* running server-side actions

On the frontend side Supler provides:

* generating HTML basing on JSON form description
* serializing a (possibly modified) form to JSON
* running client-side validations
* customization of the HTML generation process
* automatically refreshing the form after a field is changed or an action invoked

As important as Supler's features, are things that Supler **does not** do. Supler does not define or mandate how the
objects backing the forms should work, how are they persisted, what is their lifecycle; it is agnostic as to which
Javascript/web framework you use or how HTTP sessions are managed. The generated HTML has elements with predictable
names and can be easily customized.

License: `Apache2 <https://github.com/softwaremill/supler/blob/master/LICENSE>`_.

`Head over to our user/development forum <https://groups.google.com/forum/#!forum/supler>`_ if you have any questions.

Complete documentation
======================

.. toctree::
   :maxdepth: 2

   first
   setup
   livedemo
   backend/formdef/basics
   backend/formdef/typetransformations
   backend/formdef/subforms
   backend/formdef/validation
   backend/formdef/possiblevalues
   backend/formdef/collections
   backend/formdef/renderhints
   backend/formdef/actions
   backend/formdef/static
   backend/formwithobject
   frontend/rendering
   frontend/clientsideval
   frontend/serializing
   frontend/customizingrender
   frontend/i18n
   frontend/refreshes
   frontend/custombehavior
   frontend/customdata