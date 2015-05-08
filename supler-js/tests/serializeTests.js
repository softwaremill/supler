describe('serialization', function() {
  it('should serialize a basic form', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.simple1.obj1);
  });

  it('should serialize a basic form with meta', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simpleWithMeta.form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.simpleWithMeta.obj1);
  });

  it('should serialize after changes', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.simple1.form1);

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

  it('should serialize a form with a list of subforms rendered as a table', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSubformsList.formTableNonEmpty);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.complexSubformsList.objNonEmpty);
  });

  it('should serialize a form with a list of subforms rendered as a list', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSubformsList.formListNonEmpty);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.complexSubformsList.objNonEmpty);
  });

  it('should serialize a form with a single subform', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexSingleSubform.form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.complexSingleSubform.obj1);
  });

  it('should serialize a form with an optional subform, if the subform is present', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexOptionalSubform.formSome);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.complexOptionalSubform.objSome);
  });

  it('should serialize a form with an optional subform, if the subform is absent', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexOptionalSubform.formNone);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(data.complexOptionalSubform.objNone);
  });

  it('should serialize a form with an optional int when there is no value initially', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.optionalInt.formIntNone);

    // when
    var serialized = sf.getValue();

    // then
    serialized.f1.should.equal('b');
    assert.isNull(serialized.f2);
  });

  it('should serialize a form with an optional int when there is a value initially', function() {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.optionalInt.formIntSome);

    // when
    var serialized1 = sf.getValue();

    byName('f2').val('');
    var serialized2 = sf.getValue();

    // then
    serialized1.f1.should.equal('a');
    serialized1.f2.should.equal(8);

    serialized2.f1.should.equal('a');
    assert.isNull(serialized2.f2);
  });

  it('should serialize an optional select when a value is selected', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.selectSingle.form1opt);

    // then
    sf.getValue().field1.should.equal('1');
  });

  it('should serialize an optional select when no value is selected', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.selectSingle.form2opt);

    // then
    assert.isNull(sf.getValue().field1);
  });

  it('should serialize an optional select rendered as radio buttons when a value is selected', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.selectSingle.form1optRadio);

    // then
    sf.getValue().field1.should.equal('1');
  });

  it('should serialize an optional select rendered as radio buttons when no value is selected', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.selectSingle.form2optRadio);

    // then
    assert.isNull(sf.getValue().field1);
  });

  it('should serialize second-level embedded form', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.complexSecondLevelSubform.form2lvl);

    // then
    sf.getValue().subform.simple.field1.should.equal('f11');
  });
});
