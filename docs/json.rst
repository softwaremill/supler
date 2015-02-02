.. _json:

Supler-generated JSON
=====================

Supler generates two kinds of JSON objects:

* the backend: form description, with field values, validation errors
* the frontend: serialized form with field values

Both are quite easy to understand without knowing much about how Supler works. For example, the JSON form description
corresponding to the form from :ref:`the live demo <example>` is:

.. code-block:: javascript

    {
        "is_supler_form": true,
        "main_form": {
            "fields": {
                "firstName": {
                    "label": "label_person_firstname",
                    "type": "string",
                    "validate": {
                        "required": true
                    },
                    "path": "firstName",
                    "value": "Adam",
                    "empty_value": ""
                },
                "lastName": {
                    "label": "label_person_lastname",
                    "type": "string",
                    "validate": {
                        "required": true
                    },
                    "path": "lastName",
                    "value": "",
                    "empty_value": ""
                },
                "age": {
                    "label": "Age",
                    "type": "integer",
                    "validate": {
                        "required": true
                    },
                    "path": "age",
                    "value": 10,
                    "empty_value": 0
                },
                "birthday": {
                    "label": "Birthday",
                    "type": "string",
                    "validate": {
                        "required": true
                    },
                    "path": "birthday",
                    "value": "2015-02-02"
                },
                "likesBroccoli": {
                    "label": "Likes broccoli",
                    "type": "boolean",
                    "validate": {
                        "required": true
                    },
                    "path": "likesBroccoli",
                    "value": false
                },
                "address1": {
                    "label": "Address 1",
                    "type": "string",
                    "validate": {
                        "required": false
                    },
                    "path": "address1"
                },
                "address2": {
                    "label": "Address 2",
                    "type": "string",
                    "validate": {
                        "required": false
                    },
                    "path": "address2"
                },
                "favoriteColors": {
                    "label": "Favorite colors",
                    "type": "select",
                    "validate": {},
                    "path": "favoriteColors",
                    "value": [0, 2],
                    "multiple": true,
                    "possible_values": [{
                        "index": 0,
                        "label": "red"
                    }, {
                        "index": 1,
                        "label": "green"
                    }, {
                        "index": 2,
                        "label": "blue"
                    }, {
                        "index": 3,
                        "label": "magenta"
                    }
                    ]
                },
                "gender": {
                    "label": "Gender",
                    "type": "select",
                    "validate": {
                        "required": true
                    },
                    "path": "gender",
                    "value": - 1,
                    "empty_value": - 1,
                    "render_hint": {
                        "name": "radio"
                    },
                    "possible_values": [{
                        "index": 0,
                        "label": "Male"
                    }, {
                        "index": 1,
                        "label": "Female"
                    }
                    ]
                },
                "secret": {
                    "label": "Secret",
                    "type": "string",
                    "validate": {
                        "required": false
                    },
                    "path": "secret",
                    "render_hint": {
                        "name": "password"
                    }
                },
                "bio": {
                    "label": "Biography",
                    "type": "string",
                    "validate": {
                        "required": false
                    },
                    "path": "bio",
                    "render_hint": {
                        "name": "textarea",
                        "rows": 6
                    }
                },
                "cars": {
                    "type": "subform",
                    "render_hint": {
                        "name": "list"
                    },
                    "multiple": true,
                    "label": "Cars",
                    "path": "cars",
                    "value": [{
                        "fields": {
                            "make": {
                                "label": "Make",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "cars[0].make",
                                "value": 0,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "Ford"
                                }, {
                                    "index": 1,
                                    "label": "Toyota"
                                }, {
                                    "index": 2,
                                    "label": "KIA"
                                }, {
                                    "index": 3,
                                    "label": "Lada"
                                }
                                ]
                            },
                            "model": {
                                "label": "Model",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "cars[0].model",
                                "value": 1,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "Ka"
                                }, {
                                    "index": 1,
                                    "label": "Focus"
                                }, {
                                    "index": 2,
                                    "label": "Mondeo"
                                }, {
                                    "index": 3,
                                    "label": "Transit"
                                }
                                ]
                            },
                            "year": {
                                "label": "Year",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "gt": 1900
                                },
                                "path": "cars[0].year",
                                "value": 1990,
                                "empty_value": 0
                            },
                            "delete": {
                                "label": "Delete",
                                "type": "action",
                                "path": "cars[0].delete",
                                "validation_scope": {
                                    "name": "none"
                                }
                            }
                        }
                    }, {
                        "fields": {
                            "make": {
                                "label": "Make",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "cars[1].make",
                                "value": 1,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "Ford"
                                }, {
                                    "index": 1,
                                    "label": "Toyota"
                                }, {
                                    "index": 2,
                                    "label": "KIA"
                                }, {
                                    "index": 3,
                                    "label": "Lada"
                                }
                                ]
                            },
                            "model": {
                                "label": "Model",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "cars[1].model",
                                "value": 5,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "Aygo"
                                }, {
                                    "index": 1,
                                    "label": "Yaris"
                                }, {
                                    "index": 2,
                                    "label": "Corolla"
                                }, {
                                    "index": 3,
                                    "label": "Auris"
                                }, {
                                    "index": 4,
                                    "label": "Verso"
                                }, {
                                    "index": 5,
                                    "label": "Avensis"
                                }, {
                                    "index": 6,
                                    "label": "Rav4"
                                }
                                ]
                            },
                            "year": {
                                "label": "Year",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "gt": 1900
                                },
                                "path": "cars[1].year",
                                "value": 2004,
                                "empty_value": 0
                            },
                            "delete": {
                                "label": "Delete",
                                "type": "action",
                                "path": "cars[1].delete",
                                "validation_scope": {
                                    "name": "none"
                                }
                            }
                        }
                    }
                    ]
                },
                "addcar": {
                    "label": "Add car",
                    "type": "action",
                    "path": "addcar",
                    "validation_scope": {
                        "name": "none"
                    }
                },
                "legoSets": {
                    "type": "subform",
                    "render_hint": {
                        "name": "table"
                    },
                    "multiple": true,
                    "label": "Lego sets",
                    "path": "legoSets",
                    "value": [{
                        "fields": {
                            "name": {
                                "label": "label_lego_name",
                                "type": "string",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[0].name",
                                "value": "Motorcycle",
                                "empty_value": ""
                            },
                            "theme": {
                                "label": "label_lego_theme",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[0].theme",
                                "value": 1,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "City"
                                }, {
                                    "index": 1,
                                    "label": "Technic"
                                }, {
                                    "index": 2,
                                    "label": "Duplo"
                                }, {
                                    "index": 3,
                                    "label": "Space"
                                }, {
                                    "index": 4,
                                    "label": "Friends"
                                }, {
                                    "index": 5,
                                    "label": "Universal"
                                }
                                ]
                            },
                            "number": {
                                "label": "label_lego_setnumber",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "lt": 100000
                                },
                                "path": "legoSets[0].number",
                                "value": 1924,
                                "empty_value": 0
                            },
                            "age": {
                                "label": "label_lego_age",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "ge": 0,
                                    "le": 50
                                },
                                "path": "legoSets[0].age",
                                "value": 31,
                                "empty_value": 0
                            },
                            "delete": {
                                "label": "Delete",
                                "type": "action",
                                "path": "legoSets[0].delete",
                                "validation_scope": {
                                    "name": "none"
                                }
                            }
                        }
                    }, {
                        "fields": {
                            "name": {
                                "label": "label_lego_name",
                                "type": "string",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[1].name",
                                "value": "Arctic Supply Plane",
                                "empty_value": ""
                            },
                            "theme": {
                                "label": "label_lego_theme",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[1].theme",
                                "value": 0,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "City"
                                }, {
                                    "index": 1,
                                    "label": "Technic"
                                }, {
                                    "index": 2,
                                    "label": "Duplo"
                                }, {
                                    "index": 3,
                                    "label": "Space"
                                }, {
                                    "index": 4,
                                    "label": "Friends"
                                }, {
                                    "index": 5,
                                    "label": "Universal"
                                }
                                ]
                            },
                            "number": {
                                "label": "label_lego_setnumber",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "lt": 100000
                                },
                                "path": "legoSets[1].number",
                                "value": 60064,
                                "empty_value": 0
                            },
                            "age": {
                                "label": "label_lego_age",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "ge": 0,
                                    "le": 50
                                },
                                "path": "legoSets[1].age",
                                "value": 1,
                                "empty_value": 0
                            },
                            "delete": {
                                "label": "Delete",
                                "type": "action",
                                "path": "legoSets[1].delete",
                                "validation_scope": {
                                    "name": "none"
                                }
                            }
                        }
                    }, {
                        "fields": {
                            "name": {
                                "label": "label_lego_name",
                                "type": "string",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[2].name",
                                "value": "Princess and Horse",
                                "empty_value": ""
                            },
                            "theme": {
                                "label": "label_lego_theme",
                                "type": "select",
                                "validate": {
                                    "required": true
                                },
                                "path": "legoSets[2].theme",
                                "value": 2,
                                "possible_values": [{
                                    "index": 0,
                                    "label": "City"
                                }, {
                                    "index": 1,
                                    "label": "Technic"
                                }, {
                                    "index": 2,
                                    "label": "Duplo"
                                }, {
                                    "index": 3,
                                    "label": "Space"
                                }, {
                                    "index": 4,
                                    "label": "Friends"
                                }, {
                                    "index": 5,
                                    "label": "Universal"
                                }
                                ]
                            },
                            "number": {
                                "label": "label_lego_setnumber",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "lt": 100000
                                },
                                "path": "legoSets[2].number",
                                "value": 4825,
                                "empty_value": 0
                            },
                            "age": {
                                "label": "label_lego_age",
                                "type": "integer",
                                "validate": {
                                    "required": true,
                                    "ge": 0,
                                    "le": 50
                                },
                                "path": "legoSets[2].age",
                                "value": 7,
                                "empty_value": 0
                            },
                            "delete": {
                                "label": "Delete",
                                "type": "action",
                                "path": "legoSets[2].delete",
                                "validation_scope": {
                                    "name": "none"
                                }
                            }
                        }
                    }
                    ]
                },
                "addlegoset": {
                    "label": "Add lego set",
                    "type": "action",
                    "path": "addlegoset",
                    "validation_scope": {
                        "name": "none"
                    }
                },
                "_supler_static_-14223408": {
                    "label": "Registration date",
                    "type": "static",
                    "validate": {},
                    "path": "_supler_static_-14223408",
                    "value": {
                        "params": [],
                        "key": "2012-02-19"
                    }
                },
                "save": {
                    "label": "Save",
                    "type": "action",
                    "path": "save",
                    "validation_scope": {
                        "name": "all"
                    }
                }
            }
        },
        "errors": []
    }

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