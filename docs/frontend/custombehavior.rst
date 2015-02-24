.. _afterrender:

Frontend: Adding custom behavior to the form
============================================

By setting the ``after_render_function`` option to a no-argument function, it is possible to get notified after a form
is rendered (or refreshed), and customize the form or add some custom dynamic behavior. An example of such
customization in :ref:`the live-demo example <example>`, is using a stylized date picker plugin for date fields.