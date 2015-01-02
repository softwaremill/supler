describe('form validation', function(){
  it('should run client-side validation and add errors', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);
    byName('field1').val('');

    // when
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement1 = validationElementByName('field1');
    validationElement1.innerText.should.have.length.above(0);

    var validationElement3 = validationElementByName('field3');
    validationElement3.innerText.should.have.length.above(0);
  });

  it('should run client-side validation and return false if there are none', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

    // when
    byName('field3').val(11);
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(false);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length(0);
  });

  it('should render with server-side errors', function() {
    // given
    var sf = new SuplerForm(container);

    // when
    sf.render(simple1.form1validated);

    // then
    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });
});
