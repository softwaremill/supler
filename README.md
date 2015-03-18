# supler - Functional Reactive Form Library

[![Build Status](https://travis-ci.org/softwaremill/supler.svg?branch=master)](https://travis-ci.org/softwaremill/supler)
[![Join the chat at https://gitter.im/softwaremill/supler](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/softwaremill/supler?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Maven Central](https://maven-badges.herokuapp.com/maven-central/com.softwaremill.supler/supler_2.11/badge.svg)](https://maven-badges.herokuapp.com/maven-central/com.softwaremill.supler/supler_2.11)

## Links

* [documentation](http://docs.supler.io)
* [forum](https://groups.google.com/forum/#!forum/supler)
* [the introduction blog](http://www.warski.org/blog/2014/09/introducing-supler-a-functional-reactive-form-library/)
* [the live demo](http://supler.softwaremill.com/)

## Introduction

Supler is a **library** which makes writing complex form easier. It has server-side (Scala) and client-side
(JavaScript) components.

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

Supler does not define or mandate how the objects/entities backing the forms should work, how are they persisted,
how are sessions managed or how you handle requests. It is also agnostic to other JS frameworks and libraries. The
generated HTML has elements with predictable names, which can be easily customized.

## Supler diagram

![Supler diagram](https://raw.githubusercontent.com/softwaremill/supler/master/design/supler%20diagram.png)

## Hacking on Supler

The backend is built using [SBT](http://www.scala-sbt.org).

The frontend is built using [Grunt](http://gruntjs.com). To start on-change compilation of Typescript sources,
running tests and a live-reload server:

* `cd supler-js`
* `npm install`
* `grunt dev`

## Version history

0.3.0 - 18/03/2015

* field options on the frontend:
  - field order
  - javascript rendering overrides
  - render hints overrides
* custom render hints
* multiple fields in one row rendering
* complex fields support
* bug fixes and various improvements

0.2.0 - 29/01/2015

* subforms extensions
* ajax queueing
* tests
* bug fixes
* docs

0.1.0 - 16/12/2014

* initial release

## Contributors

* [Tomasz Szymański](http://twitter.com/szimano)
* [Adam Warski](http://twitter.com/adamwarski)
