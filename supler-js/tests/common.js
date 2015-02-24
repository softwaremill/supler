chai.should();
var assert = chai.assert;

var container = document.getElementById('container');

function byName(name, extra) {
  return $('[name = "' + name + '"]' + (extra || '') + '');
}

function validationElementByName(name) {
  var validationId2 = byName(name).attr(Supler.SuplerAttributes.VALIDATION_ID);
  return document.getElementById(validationId2);
}

function selectLabels(name) {
  return [].slice.call(byName(name)[0].options).map(function(o) { return o.text; });
}

function radioValues(name) {
  return byName(name).toArray().map(function(o) { return o.value; });
}
