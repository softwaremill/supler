describe('conditional', function(){
  it('should render and serialize a form with a conditional enabled field normally', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1conditional.form1enabled);

    // when
    var serialized = sf.getValue();

    // then
    serialized.field1.should.equal('v1');
    serialized.field2.should.equal('v2');

    var field1disabled = byName('field1').prop('disabled');
    field1disabled.should.equal(false);
  });

  it('should disable a field', function() {
    // given
    var sf = new SuplerForm(container);

    // when
    sf.render(simple1conditional.form1disabled);

    // then
    var field1disabled = byName('field1').prop('disabled');
    field1disabled.should.equal(true);
  });

  it('should not include disable fields when serializing', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1conditional.form1disabled);

    // when
    var serialized = sf.getValue();

    // then
    assert.isUndefined(serialized.field1);
  });

  it('should validate disabled fields', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(simple1conditional.form2disabled);

    // when
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement1 = validationElementByName('field1');
    validationElement1.innerText.should.have.length.above(0);
  });

  it('should disable a subform', function() {
    // given
    var sf = new SuplerForm(container);

    // when
    sf.render(complex1conditional.form1disabled);

    // then
    var field1disabled = byName('simples[0].field1').prop('disabled');
    field1disabled.should.equal(true);
  });
});
