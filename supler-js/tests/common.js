chai.should();
var container = document.getElementById('container');

function byName(name) {
  return $('[name = "' + name + '"]');
}

function validationElementByName(name) {
  var validationId2 = byName(name).attr(SuplerAttributes.VALIDATION_ID);
  return document.getElementById(validationId2);
}
