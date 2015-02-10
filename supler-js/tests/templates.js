describe('templates', function() {
  after(function(){
    //container.innerHTML = '';
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
    sf.render(actionSimple.formOneActionValidateNone);

    // then
    byName('addx').attr('customattr').should.equal('custombutton');
    byName('addx').click();
    state.should.equal(2);
  });

  it('should use an input template for the specified boolean field', function() {
    // given
    container.innerHTML = document.getElementById('templates_oneinput_boolean').innerHTML;

    // when
    var sf = new SuplerForm(container);
    sf.render(simple1.form1);

    var serialized1 = sf.getValue();
    var validate1 = sf.validate();

    byName('field4').prop('checked', function( i, val ) { return i === 0; });

    var serialized2 = sf.getValue();
    var validate2 = sf.validate();

    // then
    byName('field4').attr('customattr').should.equal('y');

    serialized1.field4.should.equal(true);
    validate1.should.equal(false);

    serialized2.field4.should.equal(false);
    validate2.should.equal(false);
  });
});
