describe('simple1', function(){
  it('should serialize', function(){
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.simple1form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(simple1.simple1obj1);
  });

  it('should serialize after changes', function(){
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.simple1form1);

    // when
    byName('field1').val('v11');
    byName('field2').val('');
    byName('field3').val(15);
    byName('field4').prop('checked', function( i, val ) { return i === 0; });

    var serialized = sf.getValue();

    // then
    serialized.field1.should.equal('v11');
    serialized.field2.should.equal('');
    serialized.field3.should.equal(15);
    serialized.field4.should.equal(false);
  });

  it('should run client-side validation and add errors if there are some', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.simple1form1);

    // when
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });

  it('should run client-side validation and return false if there are none', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.simple1form1);

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
    sf.render(simple1.simple1form1validated);

    // then
    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });

  it('should reload after field change', function(done) {
    // given
    var reloadFormFn = function reloadForm(formJson, successFn) {
      successFn(simple1.simple1form2);

      // then
      byName('field1').val().should.equal('v1');
      byName('field2').val().should.equal('');
      byName('field3').val().should.equal('15');

      done();
    };

    var sf = new SuplerForm(container, {
      reload_form_function: reloadFormFn
    });

    // when
    sf.render(simple1.simple1form1);
    byName('field1').change();

    // then in callback
  });
});
