describe('form validation', function() {
  it('should run client-side validation and add errors', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form3invalid);
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

  it('should run client-side validation and not add errors if the validation scope is none', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form3invalid);
    byName('field1').val('');

    // when
    var validationResult = sf.validate(Supler.ValidateNone);

    // then
    validationResult.should.equal(false);
  });

  it('should run client-side validation and return false if there are none', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form3invalid);

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
    var sf = new Supler.Form(container);

    // when
    sf.render(data.simple1.form3invalidValidated);

    // then
    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });

  it('should re-run client-side validation for fields with unchanged values after send', function() {
    // given
    var sendFormFn = function sendForm(formValue, renderResponseFn, sendErrorFn, isAction, triggeringElement) {
      renderResponseFn(data.simple1.form3invalid);
    };

    var sf = new Supler.Form(container, {
      send_form_function: sendFormFn
    });
    sf.render(data.simple1.form3invalid);

    // when
    var validationResult = sf.validate();
    byName('field1').change();

    // then
    validationResult.should.equal(true);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length.above(0);
  });

  it('should re-run client-side validation for fields with changed values after send and not add errors', function() {
    // given
    var sendFormFn = function sendForm(formValue, renderResponseFn, sendErrorFn, isAction, triggeringElement) {
      renderResponseFn(data.simple1.form2); // field3 is changed
    };

    var sf = new Supler.Form(container, {
      send_form_function: sendFormFn
    });
    sf.render(data.simple1.form3invalid);

    // when
    var validationResult = sf.validate();
    byName('field1').change();

    // then
    validationResult.should.equal(true);

    var validationElement = validationElementByName('field3');
    validationElement.innerText.should.have.length(0);
  });

  it('should validate fields in subforms list', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSubformsList.formListNonEmpty);

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
  });

  it('should validate only the subform if the validation scope specifies so', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSubformsList.formListNonEmpty);

    // when
    byName('field10').val('');
    byName('simples[0].field1').val('');
    byName('simples[1].field1').val('');
    var validationResult = sf.validate(new Supler.ValidateInPath('simples[1]'));

    // then
    validationResult.should.equal(true);

    var validationElementRoot = validationElementByName('field10');
    validationElementRoot.innerText.should.have.length(0);

    var validationElementSub01 = validationElementByName('simples[0].field1');
    validationElementSub01.innerText.should.have.length(0);

    var validationElementSub21 = validationElementByName('simples[1].field1');
    validationElementSub21.innerText.should.not.have.length(0);
  });

  it('should validate fields in a single subform', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSingleSubform.form1);

    // when
    byName('simple.field1').val('');
    byName('simple.field3').val('1');
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement01 = validationElementByName('simple.field1');
    validationElement01.innerText.should.not.have.length(0);

    var validationElement23 = validationElementByName('simple.field3');
    validationElement23.innerText.should.not.have.length(0);
  });

  it('should validate optional string fields', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.validateIfDefinedOpt.stringOkSome);
    var validationResultStringOkSome = sf.validate();

    sf.render(data.validateIfDefinedOpt.stringOkNone);
    var validationResultStringOkNone = sf.validate();

    sf.render(data.validateIfDefinedOpt.stringError);
    var validationResultStringError = sf.validate();

    // then
    validationResultStringOkSome.should.equal(false);
    validationResultStringOkNone.should.equal(false);
    validationResultStringError.should.equal(true);
  });

  it('should validate optional int fields', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.validateIfDefinedOpt.intOkSome);
    var validationResultIntOkSome = sf.validate();

    sf.render(data.validateIfDefinedOpt.intOkNone);
    var validationResultIntOkNone = sf.validate();

    sf.render(data.validateIfDefinedOpt.intError);
    var validationResultIntError = sf.validate();

    // then
    validationResultIntOkSome.should.equal(false);
    validationResultIntOkNone.should.equal(false);
    validationResultIntError.should.equal(true);
  });

  it('should validate all types of numeric fields', function() {
    var sf = new Supler.Form(container);

    sf.render(data.validateNumbers.formOk);
    sf.validate().should.equal(false);

    sf.render(data.validateNumbers.formError);
    sf.validate().should.equal(true);

    validationElementByName('f1').innerText.should.not.have.length(0);
    validationElementByName('f2').innerText.should.not.have.length(0);
    validationElementByName('f3').innerText.should.not.have.length(0);
    validationElementByName('f4').innerText.should.not.have.length(0);
  });

  it('should run client-side validations after a field is changed, even if send_form_function is not defined', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form1);

    // when
    byName('field1').val('');
    byName('field1').change();

    // then
    var validationElement1 = validationElementByName('field1');
    validationElement1.innerText.should.have.length.above(0);
  });
});
