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
        "supler_meta": {},
        "is_supler_form": true,
        "main_form": {
            "fields": [{
                "name": "firstName",
                "enabled": true,
                "label": "label_person_firstname",
                "type": "string",
                "validate": {
                    "required": true
                },
                "path": "firstName",
                "value": "Adam",
                "empty_value": ""
            }, {
                "name": "lastName",
                "enabled": true,
                "label": "label_person_lastname",
                "type": "string",
                "validate": {
                    "required": true
                },
                "path": "lastName",
                "value": "",
                "empty_value": ""
            }, {
                "name": "age",
                "enabled": true,
                "label": "Age",
                "type": "integer",
                "validate": {
                    "required": true
                },
                "path": "age",
                "value": 10,
                "empty_value": 0
            }, {
                "name": "birthday",
                "enabled": true,
                "label": "Birthday",
                "type": "string",
                "validate": {
                    "required": true
                },
                "path": "birthday",
                "value": "2015-02-24"
            }, {
                "name": "likesBroccoli",
                "enabled": true,
                "label": "Likes broccoli",
                "type": "boolean",
                "validate": {
                    "required": true
                },
                "path": "likesBroccoli",
                "value": false
            }, {
                "name": "address1",
                "enabled": true,
                "label": "Address 1",
                "type": "string",
                "validate": {
                    "required": false
                },
                "path": "address1"
            }, {
                "name": "address2",
                "enabled": true,
                "label": "Address 2",
                "type": "string",
                "validate": {
                    "required": false
                },
                "path": "address2"
            }, {
                "name": "favoriteColors",
                "enabled": true,
                "label": "Favorite colors",
                "type": "select",
                "validate": {
                    "required": false
                },
                "path": "favoriteColors",
                "value": ["0", "2"],
                "possible_values": [{
                    "id": "0",
                    "label": "red"
                }, {
                    "id": "1",
                    "label": "green"
                }, {
                    "id": "2",
                    "label": "blue"
                }, {
                    "id": "3",
                    "label": "magenta"
                }
                ],
                "multiple": true
            }, {
                "name": "gender",
                "enabled": true,
                "label": "Gender",
                "type": "select",
                "validate": {
                    "required": true
                },
                "path": "gender",
                "value": null,
                "empty_value": null,
                "render_hint": {
                    "name": "radio"
                },
                "possible_values": [{
                    "id": "0",
                    "label": "Male"
                }, {
                    "id": "1",
                    "label": "Female"
                }
                ]
            }, {
                "name": "secret",
                "enabled": true,
                "label": "Secret",
                "type": "string",
                "validate": {
                    "required": false
                },
                "path": "secret",
                "render_hint": {
                    "name": "password"
                }
            }, {
                "name": "bio",
                "enabled": true,
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
            }, {
                "name": "cars",
                "enabled": true,
                "type": "subform",
                "render_hint": {
                    "name": "list"
                },
                "multiple": true,
                "label": "Cars",
                "path": "cars",
                "value": [{
                    "fields": [{
                        "name": "make",
                        "enabled": true,
                        "label": "Make",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "cars[0].make",
                        "value": "0",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "Ford"
                        }, {
                            "id": "1",
                            "label": "Toyota"
                        }, {
                            "id": "2",
                            "label": "KIA"
                        }, {
                            "id": "3",
                            "label": "Lada"
                        }
                        ]
                    }, {
                        "name": "model",
                        "enabled": true,
                        "label": "Model",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "cars[0].model",
                        "value": "1",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "Ka"
                        }, {
                            "id": "1",
                            "label": "Focus"
                        }, {
                            "id": "2",
                            "label": "Mondeo"
                        }, {
                            "id": "3",
                            "label": "Transit"
                        }
                        ]
                    }, {
                        "name": "year",
                        "enabled": true,
                        "label": "Year",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "gt": 1900.0
                        },
                        "path": "cars[0].year",
                        "value": 1990,
                        "empty_value": 0
                    }, {
                        "name": "delete",
                        "enabled": true,
                        "label": "Delete",
                        "type": "action",
                        "path": "cars[0].delete",
                        "validation_scope": {
                            "name": "none"
                        }
                    }
                    ]
                }, {
                    "fields": [{
                        "name": "make",
                        "enabled": true,
                        "label": "Make",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "cars[1].make",
                        "value": "1",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "Ford"
                        }, {
                            "id": "1",
                            "label": "Toyota"
                        }, {
                            "id": "2",
                            "label": "KIA"
                        }, {
                            "id": "3",
                            "label": "Lada"
                        }
                        ]
                    }, {
                        "name": "model",
                        "enabled": true,
                        "label": "Model",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "cars[1].model",
                        "value": "5",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "Aygo"
                        }, {
                            "id": "1",
                            "label": "Yaris"
                        }, {
                            "id": "2",
                            "label": "Corolla"
                        }, {
                            "id": "3",
                            "label": "Auris"
                        }, {
                            "id": "4",
                            "label": "Verso"
                        }, {
                            "id": "5",
                            "label": "Avensis"
                        }, {
                            "id": "6",
                            "label": "Rav4"
                        }
                        ]
                    }, {
                        "name": "year",
                        "enabled": true,
                        "label": "Year",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "gt": 1900.0
                        },
                        "path": "cars[1].year",
                        "value": 2004,
                        "empty_value": 0
                    }, {
                        "name": "delete",
                        "enabled": true,
                        "label": "Delete",
                        "type": "action",
                        "path": "cars[1].delete",
                        "validation_scope": {
                            "name": "none"
                        }
                    }
                    ]
                }
                ]
            }, {
                "name": "addcar",
                "enabled": true,
                "label": "Add car",
                "type": "action",
                "path": "addcar",
                "validation_scope": {
                    "name": "none"
                }
            }, {
                "name": "legoSets",
                "enabled": true,
                "type": "subform",
                "render_hint": {
                    "name": "table"
                },
                "multiple": true,
                "label": "Lego sets",
                "path": "legoSets",
                "value": [{
                    "fields": [{
                        "name": "name",
                        "enabled": true,
                        "label": "label_lego_name",
                        "type": "string",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[0].name",
                        "value": "Motorcycle",
                        "empty_value": ""
                    }, {
                        "name": "theme",
                        "enabled": true,
                        "label": "label_lego_theme",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[0].theme",
                        "value": "1",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "City"
                        }, {
                            "id": "1",
                            "label": "Technic"
                        }, {
                            "id": "2",
                            "label": "Duplo"
                        }, {
                            "id": "3",
                            "label": "Space"
                        }, {
                            "id": "4",
                            "label": "Friends"
                        }, {
                            "id": "5",
                            "label": "Universal"
                        }
                        ]
                    }, {
                        "name": "number",
                        "enabled": true,
                        "label": "label_lego_setnumber",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "lt": 100000.0
                        },
                        "path": "legoSets[0].number",
                        "value": 1924,
                        "empty_value": 0
                    }, {
                        "name": "age",
                        "enabled": true,
                        "label": "label_lego_age",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "ge": 0.0,
                            "le": 50.0
                        },
                        "path": "legoSets[0].age",
                        "value": 31,
                        "empty_value": 0
                    }, {
                        "name": "delete",
                        "enabled": true,
                        "label": "Delete",
                        "type": "action",
                        "path": "legoSets[0].delete",
                        "validation_scope": {
                            "name": "none"
                        }
                    }
                    ]
                }, {
                    "fields": [{
                        "name": "name",
                        "enabled": true,
                        "label": "label_lego_name",
                        "type": "string",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[1].name",
                        "value": "Arctic Supply Plane",
                        "empty_value": ""
                    }, {
                        "name": "theme",
                        "enabled": true,
                        "label": "label_lego_theme",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[1].theme",
                        "value": "0",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "City"
                        }, {
                            "id": "1",
                            "label": "Technic"
                        }, {
                            "id": "2",
                            "label": "Duplo"
                        }, {
                            "id": "3",
                            "label": "Space"
                        }, {
                            "id": "4",
                            "label": "Friends"
                        }, {
                            "id": "5",
                            "label": "Universal"
                        }
                        ]
                    }, {
                        "name": "number",
                        "enabled": true,
                        "label": "label_lego_setnumber",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "lt": 100000.0
                        },
                        "path": "legoSets[1].number",
                        "value": 60064,
                        "empty_value": 0
                    }, {
                        "name": "age",
                        "enabled": true,
                        "label": "label_lego_age",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "ge": 0.0,
                            "le": 50.0
                        },
                        "path": "legoSets[1].age",
                        "value": 1,
                        "empty_value": 0
                    }, {
                        "name": "delete",
                        "enabled": true,
                        "label": "Delete",
                        "type": "action",
                        "path": "legoSets[1].delete",
                        "validation_scope": {
                            "name": "none"
                        }
                    }
                    ]
                }, {
                    "fields": [{
                        "name": "name",
                        "enabled": true,
                        "label": "label_lego_name",
                        "type": "string",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[2].name",
                        "value": "Princess and Horse",
                        "empty_value": ""
                    }, {
                        "name": "theme",
                        "enabled": true,
                        "label": "label_lego_theme",
                        "type": "select",
                        "validate": {
                            "required": true
                        },
                        "path": "legoSets[2].theme",
                        "value": "2",
                        "empty_value": null,
                        "possible_values": [{
                            "id": "0",
                            "label": "City"
                        }, {
                            "id": "1",
                            "label": "Technic"
                        }, {
                            "id": "2",
                            "label": "Duplo"
                        }, {
                            "id": "3",
                            "label": "Space"
                        }, {
                            "id": "4",
                            "label": "Friends"
                        }, {
                            "id": "5",
                            "label": "Universal"
                        }
                        ]
                    }, {
                        "name": "number",
                        "enabled": true,
                        "label": "label_lego_setnumber",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "lt": 100000.0
                        },
                        "path": "legoSets[2].number",
                        "value": 4825,
                        "empty_value": 0
                    }, {
                        "name": "age",
                        "enabled": true,
                        "label": "label_lego_age",
                        "type": "integer",
                        "validate": {
                            "required": true,
                            "ge": 0.0,
                            "le": 50.0
                        },
                        "path": "legoSets[2].age",
                        "value": 7,
                        "empty_value": 0
                    }, {
                        "name": "delete",
                        "enabled": true,
                        "label": "Delete",
                        "type": "action",
                        "path": "legoSets[2].delete",
                        "validation_scope": {
                            "name": "none"
                        }
                    }
                    ]
                }
                ]
            }, {
                "name": "addlegoset",
                "enabled": true,
                "label": "Add lego set",
                "type": "action",
                "path": "addlegoset",
                "validation_scope": {
                    "name": "none"
                }
            }, {
                "name": "_supler_static_-1418114697",
                "enabled": true,
                "label": "Registration date",
                "type": "static",
                "validate": {},
                "path": "_supler_static_-1418114697",
                "value": {
                    "params": [],
                    "key": "2012-02-19"
                }
            }, {
                "name": "id",
                "enabled": true,
                "label": "",
                "type": "string",
                "validate": {
                    "required": true
                },
                "path": "id",
                "value": "8edb51e7-73d7-4485-b590-2d0a208d6548",
                "empty_value": "",
                "render_hint": {
                    "name": "hidden"
                }
            }, {
                "name": "save",
                "enabled": true,
                "label": "Save",
                "type": "action",
                "path": "save",
                "validation_scope": {
                    "name": "all"
                }
            }
            ]
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