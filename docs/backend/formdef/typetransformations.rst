Form definition: Supported types, type transformers
===================================================

Fields of basic types (``String``, ``Int``, ``Long``, ``Float``, ``Double`` and ``Boolean``), ``UUID`` and ``Date``
are supported out-of-the-box, and can be directly edited in form fields.

If you have a more complex type, you need to provide an implicit implementation of a ``Transformer[U, S]``,
where ``U`` is your type, and ``S`` is one of the basic types. For convenience, you can extend
``StringTransformer[U]`` etc.

In the transformer, you need to implement a method which serializes your type to a basic type, and another
method which deserializes a basic type into your type, or returns a form error (conversion error).

Adding render hint automatically
--------------------------------

You may wish to add render hints on some types of transformation automatically. In that case override
 ``def renderHint: Option[RenderHint with BasicFieldCompatible]`` in your transformer.