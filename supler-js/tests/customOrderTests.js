describe('customOrder', function(){
  it('should render only the fields specified in custom order', function() {
    // given
    var sf = new Supler.Form(container, {
      order: [["field1", "field2"]]
    });

    // when
    sf.render(data.simple1.form1);

    // then
    var shownFields = suplerFields();
    shownFields.should.have.lengthOf(2);
  });
});
