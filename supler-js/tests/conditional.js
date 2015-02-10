describe('conditional', function(){
  it('should render and serialize a form with a conditional enabled field normally', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(data.conditional.simpleFormEnabled);

    // when
    var serialized = sf.getValue();

    // then
    serialized.f1.should.equal('v1');
    serialized.f2.should.equal('v2');

    var field1disabled = byName('f1').prop('disabled');
    field1disabled.should.equal(false);
  });

  it('should disable a field', function() {
    // given
    var sf = new SuplerForm(container);

    // when
    sf.render(data.conditional.simpleFormDisabled1);

    // then
    var field1disabled = byName('f1').prop('disabled');
    field1disabled.should.equal(true);
  });

  it('should not include disable fields when serializing', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(data.conditional.simpleFormDisabled1);

    // when
    var serialized = sf.getValue();

    // then
    assert.isUndefined(serialized.f1);
  });

  it('should validate disabled fields', function() {
    // given
    var sf = new SuplerForm(container);
    sf.render(data.conditional.simpleFormDisabled2);

    // when
    var validationResult = sf.validate();

    // then
    validationResult.should.equal(true);

    var validationElement1 = validationElementByName('f1');
    validationElement1.innerText.should.have.length.above(0);
  });

  it('should disable a subform', function() {
    // given
    var sf = new SuplerForm(container);

    // when
    sf.render(data.conditional.complexFormDisabled);

    // then
    var field1disabled = byName('f2[0].f1').prop('disabled');
    field1disabled.should.equal(true);
  });
});
