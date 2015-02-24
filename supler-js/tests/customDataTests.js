describe('customData', function(){
  it('should not run the data handler if the json does not contain custom data', function() {
    // given
    var handlerCalled = false;
    var sf = new Supler.Form(container, {
      custom_data_handler: function(data) {
        handlerCalled = data;
      }
    });

    // when
    sf.render(data.simple1.form1);

    // then
    handlerCalled.should.equal(false);
  });

  it('should run the custom data handler if the json contains custom data and the form', function() {
    // given
    var handlerCalled = false;
    var sf = new Supler.Form(container, {
      custom_data_handler: function(data) {
        handlerCalled = data;
      }
    });

    // when
    sf.render(data.actionSimple.formAfterActionFormAndData);

    // then
    handlerCalled.should.equal("data and form");
  });

  it('should run the custom data handler if the json contains custom data only', function() {
    // given
    var handlerCalled = false;
    var sf = new Supler.Form(container, {
      custom_data_handler: function(data) {
        handlerCalled = data;
      }
    });

    // when
    sf.render(data.actionSimple.formAfterActionDataOnly);

    // then
    handlerCalled.should.equal("data only");
  });
});
