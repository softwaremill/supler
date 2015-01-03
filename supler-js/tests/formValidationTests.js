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

  it('should preserve client-side validation for fields with unchanged values after reload', function() {
    // given
    var reloadFormFn = function reloadForm(formValue, successFn, errorFn, isAction) {
      successFn(simple1.form1);
    };

    var sf = new SuplerForm(container, {
      reload_form_function: reloadFormFn
    });
    sf.render(simple1.form1);

    // when
    var validationResult = sf.validate();
    byName('field1').change();

    // then
    validationResult.should.equal(true);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });

  it('should not preserve client-side validation for fields with changed values after reload', function() {
    // given
    var reloadFormFn = function reloadForm(formValue, successFn, errorFn, isAction) {
      successFn(simple1.form2); // field3 is changed
    };

    var sf = new SuplerForm(container, {
      reload_form_function: reloadFormFn
    });
    sf.render(simple1.form1);

    // when
    var validationResult = sf.validate();
    byName('field1').change();

    // then
    validationResult.should.equal(true);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length(0);
  });

  it('should validate fields in subforms', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(complex1.form1list);

    // when
    byName('simples[0].field1').val('');
    byName('simples[2].field3').val('1');
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement01 = validationElementByName('simples[0].field1');
    validationElement01.innerText.should.not.have.length(0);

    var validationElement21 = validationElementByName('simples[2].field1');
    validationElement21.innerText.should.have.length(0);

    var validationElement03 = validationElementByName('simples[0].field3');
    validationElement03.innerText.should.have.length(0);

    var validationElement23 = validationElementByName('simples[2].field3');
    validationElement23.innerText.should.not.have.length(0);
  })
});
