describe('modals', function () {
  afterEach(function () {
    $('.modal').modal('hide');
    container.innerHTML = '';
  });

  it('should show a modal', function () {
    // given
    var sf = new Supler.Form(container);
    sf.render(data.complexFormWithModal.complexFormWithModalAfterButton);

    // expect
    $('#myModalLabel').text().should.equal('Modal title');
    $('.form-control-static').text().should.equal('A Some(B) 1 false');
  });

  it('should send modal on field change', function () {
    var formSent = false;

    var sendFormFn = function sendForm(formValue, renderResponseFn, sendErrorFn, isAction, triggeringElement) {
      // then
      formSent = true;
    };

    // given
    var sf = new Supler.Form(container, {
      send_form_function: sendFormFn
    });
    sf.render(data.complexFormWithModal.complexFormWithModalAfterButton);

    // when
    $('#myModalLabel').filter(":visible").promise().done(function() {
      byName('field1').val('D');
      byName('field1').change();
      assert.ok(formSent, 'Modal form has not been sent');
    });
  });

});
