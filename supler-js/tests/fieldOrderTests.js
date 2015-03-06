describe('fieldOrder', function(){
  it('should render only the fields specified in custom order', function() {
    // given
    var sf = new Supler.Form(container, {
      fieldOrder: [["field1", "field2"]]
    });

    // when
    sf.render(data.simple1.form1);

    // then
    var shownFields = suplerFields();
    shownFields.should.have.lengthOf(2);
  });

  it('should render fields in rows', function() {
    // given
    var sf = new Supler.Form(container);

    // when
    sf.render(data.simple1rows.form1rows);

    // then
    var field1Parent = byName('field1').parents("div.row")[0];
    var field2Parent = byName('field2').parents("div.row")[0];
    var field3Parent = byName('field3').parents("div.row")[0];
    var field4Parent = byName('field4').parents("div.row")[0];
    field1Parent.should.equal(field2Parent);
    field3Parent.should.equal(field4Parent);
    field1Parent.should.not.equal(field4Parent);
  });
});
