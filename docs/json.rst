.. _json:

Supler-generated JSON
=====================

Supler generates two kinds of JSON objects:

* the backend: form description, with field values, validation errors
* the frontend: serialized form with field values

Both are quite easy to understand without knowing much about how Supler works. For example, the JSON form description
corresponding to the form from :ref:`the live demo <example>` is:

.. include:: json-example.json

A serialized form sent from the frontend to the backend when an action is invoked or the form refreshed is even
simpler, as it only contains the values, without any meta-data on how the form should look like:

.. code-block:: javascript

    {
        "firstName":"Adam",
        "lastName":"",
        "age":10,
        "birthday":"2015-02-02",
        "likesBroccoli":false,
        "address1":"",
        "address2":"",
        "favoriteColors":[
            0,
            2
        ],
        "secret":"",
        "bio":"",
        "cars":[
            {
                "make":0,
                "model":1,
                "year":1990
            },
            {
                "make":1,
                "model":5,
                "year":2004
            }
        ],
        "legoSets":[
            {
                "name":"Motorcycle",
                "theme":1,
                "number":1924,
                "age":31
            },
            {
                "name":"Arctic Supply Plane",
                "theme":0,
                "number":60064,
                "age":1
            },
            {
                "name":"Princess and Horse",
                "theme":2,
                "number":4825,
                "age":7
            }
        ]
    }

Moreover, Supler's frontend & backend are independent. They only communicate by the "json protocol" defined above.
You could easily implement e.g. an alternative frontend.