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
});
