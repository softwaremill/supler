describe('templates', function() {
  after(function(){
    container.innerHTML = '';
  });

  it('should use an input template for the specified field', function() {
    // given
    container.innerHTML = document.getElementById('templates_oneinput').innerHTML;

    // when
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

    // then
    byName('field1').attr('customattr').should.equal('z');
    assert.equal(byName('field2').attr('customattr'), null);
  });
});
