var schema = null;
var initial_data = null;

$(document).ready(function() {
  $.get('http://localhost:8080/form1/schema.json', function(data) {
    schema = data;
    try_show_form();
  });

  $.get('http://localhost:8080/form1/data.json', function(data) {
    initial_data = data;
    try_show_form();
  });
});

var editor_holder = document.getElementById('editor_holder');
var editor = null;
function try_show_form() {
  if (schema !== null && initial_data !== null) {
    editor = new JSONEditor(editor_holder, {
      theme: 'bootstrap3',
      schema: schema,
      startval: initial_data,
      required_by_default: true
    });
  }
}

var feedback = $('#feedback')
feedback.hide();

$('#submit').click(function() {
  $.ajax({
    url: 'http://localhost:8080/form1/data.json',
    type: 'POST',
    data: JSON.stringify(editor.getValue()),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    success: function(data) {
      feedback.html(data);
      feedback.show();
    }
  })

  return false;
});