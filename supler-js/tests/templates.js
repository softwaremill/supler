describe('templates', function() {
  after(function(){
    container.innerHTML = '';
  });

  it('should use an input template for the specified text field', function() {
    // given
    container.innerHTML = document.getElementById('templates_oneinput_text').innerHTML;

    // when
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

    // then
    byName('field1').attr('customattr').should.equal('z');
    assert.equal(byName('field2').attr('customattr'), null);
  });

  it('should use an input template for the specified button', function() {
    // given
    container.innerHTML = document.getElementById('templates_oneinput_button').innerHTML;

    var state = 1;
    function sendForm() {
      state = 2;
    }

    var sf = new SuplerForm(container, {
      send_form_function: sendForm
    });

    // when
    sf.render(simple1action.form1);

    // then
    byName('inc').attr('customattr').should.equal('custombutton');
    byName('inc').click();
    state.should.equal(2);
  });
});
