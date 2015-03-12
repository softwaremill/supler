Form definition: Supported types, type transformers
===================================================

Fields of basic types (``String``, ``Int``, ``Long``, ``Float``, ``Double`` and ``Boolean``), ``UUID`` and ``Date``
are supported out-of-the-box, and can be directly edited in form fields.

If you have a more complex type which serializes to a basic type, you need to provide an implicit implementation of a
``BasicTypeTransformer[U, S]``, where ``U`` is your type, and ``S`` is one of the basic types. For convenience, you can
extend ``StringTransformer[U]`` etc.

In the transformer, you need to implement a method which serializes your type to a basic type, and another
method which deserializes a basic type into your type, or returns a form error (conversion error).

Adding render hint automatically
--------------------------------

You may wish to add render hints on some types of transformation automatically. In that case override
 ``def renderHint: Option[RenderHint with BasicFieldCompatible]`` in your transformer.

Example: Joda-Time DateTime transformer
---------------------------------------

The `Joda-Time <http://www.joda.org/joda-time>`_ DateTime transformer can look like this::

  implicit val dateTimeTransformer = new StringTransformer[DateTime] {
    override def serialize(t: DateTime) = ISODateTimeFormat.date().print(t)

    override def deserialize(u: String) = try {
      Right(ISODateTimeFormat.date().parseDateTime(u))
    } catch {
      case e: IllegalArgumentException => Left("error_custom_illegalDateFormat")
    }

    override def renderHint = Some(asDate())
  }

.. _transform_jsonobject:

Transforming to a json object
-----------------------------

It is also possible to transform a value to a complex json object (not a plain string/number/boolean). To do that, you
need to provide an implicit ``JsonTransformer``. For example, if you have a ``Point`` class with two fields, a
transformer which serializes it to a two-field json, and deserializes from a two-field json can take the following
form::

  implicit val pointJsonTransformer: JsonTransformer[Point] = new JsonTransformer[Point] {
    override def typeName = "point"

    override def fromJValue(jvalue: JValue) = (for {
      JObject(fields) <- jvalue
      JField("x", JInt(x)) <- fields
      JField("y", JInt(y)) <- fields
    } yield Point(x.toInt, y.toInt)).headOption

    override def toJValue(value: Point) = Some(
      JObject(JField("x", JInt(value.x)), JField("y", JInt(value.y))))
  }

However, if the JSON representation of a field is a complex object, you will need to add support for that in the
frontend as well. See :ref:`complexjson` for more information