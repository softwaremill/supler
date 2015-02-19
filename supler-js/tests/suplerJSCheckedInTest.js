describe('supler.js checked in', function(){
  it('should have the generated supler.js commited in git', function() {
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
});
