describe('serialization', function() {
  it('should serialize a basic form', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(simple1.obj1);
  });

  it('should serialize after changes', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

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
    var sf = new SuplerForm(container);
    sf.render(complexSubformsList.formTableNonEmpty);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(complexSubformsList.objNonEmpty);
  });

  it('should serialize a form with a list of subforms rendered as a list', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(complexSubformsList.formListNonEmpty);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(complexSubformsList.objNonEmpty);
  });

  it('should serialize a form with a single subform', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(complexSingleSubform.form1);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(complexSingleSubform.obj1);
  });

  it('should serialize a form with an optional subform, if the subform is present', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(complexOptionalSubform.formSome);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(complexOptionalSubform.objSome);
  });

  it('should serialize a form with an optional subform, if the subform is absent', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(complexOptionalSubform.formNone);

    // when
    var serialized = sf.getValue();

    // then
    serialized.should.deep.equal(complexOptionalSubform.objNone);
  });
});
