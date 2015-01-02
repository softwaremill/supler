describe('reload', function(){
  it('should reload after field change', function(done) {
    // given
    var reloadFormFn = function reloadForm(formValue, successFn, errorFn, isAction) {
      successFn(simple1.form2);

      // then
      byName('field1').val().should.equal('v1');
      byName('field2').val().should.equal('');
      byName('field3').val().should.equal('15');

      done();
    };

    var sf = new SuplerForm(container, {
      reload_form_function: reloadFormFn
    });

    // when
    sf.render(simple1.form1);
    byName('field1').change();

    // then in callback
  });

  it('should apply results of the last refresh-reload started only', function() {
    // given
    var state = 1;
    var successFn1 = null;
    var successFn2 = null;

    function reloadForm(formValue, successFn, errorFn, isAction) {
      if (state === 1) {
        // we pretend the request is taking some time, so we are just putting the successFn aside and allow
        // the test to continue
        successFn1 = successFn;
        state = 2;
      } else if (state === 2) {
        successFn2 = successFn;
        state = 3;
      } else {
        assert.fail(0, state, 'Reload called in an illegal state');
      }
    }

    var sf = new SuplerForm(container, {
      reload_form_function: reloadForm
    });

    // when & then
    sf.render(simple1.form1);
    byName('field3').val(20);

    byName('field3').change();
    state.should.equal(2);

    byName('field3').change();
    state.should.equal(3);

    // first request completes, but another is started -> results should not be applied
    successFn1(simple1.form2);
    byName('field3').val().should.not.equal('15');

    // second request completes, results should be applied
    successFn2(simple1.form2);
    byName('field3').val().should.equal('15');
  });

  it('should drop refresh-reloads when an action is in progress', function() {
    // given
    var state = 1;
    var actionSuccessFn = null;

    function reloadForm(formValue, successFn, errorFn, isAction) {
      if (state === 1) {
        actionSuccessFn = successFn;
        state = 2;
      } else {
        assert.fail(1, state, 'The refresh-reload should have been dropped!');
      }
    }

    var sf = new SuplerForm(container, {
      reload_form_function: reloadForm
    });

    // when & then
    sf.render(simple1.form1action);

    byName('inc').click();
    state.should.equal(2);

    byName('field3').val(1);
    byName('field3').change();
    state = 3;

    // first request completes, but another is started -> results should not be applied
    actionSuccessFn(simple1.form2action);
    byName('field3').val().should.equal('15');
  });

  it('should enqueue actions when an action is in progress', function() {
    // given
    var state = 1;
    var actionSuccessFn1 = null;
    var actionSuccessFn2 = null;

    function reloadForm(formValue, successFn, errorFn, isAction) {
      if (state === 1) {
        actionSuccessFn1 = successFn;
        state = 2;
      } else if (state === 2) {
        assert.fail(0, state, 'The action should have been enqueued!');
      } else if (state === 3) {
        actionSuccessFn2 = successFn;
        state = 4;

        // the form value should include the changes from the first action
        formValue.field3.should.equal(15);
      } else {
        assert.fail(0, state, 'Reload called in an illegal state');
      }
    }

    var sf = new SuplerForm(container, {
      reload_form_function: reloadForm
    });

    // when & then
    sf.render(simple1.form1action);

    byName('inc').click();
    state.should.equal(2);

    byName('inc').click();
    state = 3;

    // first action completes, second should be started.
    actionSuccessFn1(simple1.form2action);
    state.should.equal(4);

    actionSuccessFn2(simple1.form1action);
    byName('field3').val().should.equal('0');
  });

  it('should still work after an error', function() {
    // given
    var state = 1;
    var errorFn1 = null;
    var successFn2 = null;

    function reloadForm(formValue, successFn, errorFn, isAction) {
      if (state === 1) {
        errorFn1 = errorFn;
        state = 2;
      } else if (state === 2) {
        successFn2 = successFn;
        state = 3;
      } else {
        assert.fail(0, state, 'Reload called in an illegal state');
      }
    }

    var sf = new SuplerForm(container, {
      reload_form_function: reloadForm
    });

    // when & then
    sf.render(simple1.form1);
    byName('field3').val(20);

    byName('field3').change();
    state.should.equal(2);
    errorFn1();

    byName('field3').change();
    state.should.equal(3);
    successFn2(simple1.form2);

    byName('field3').val().should.equal('15');
  });
});
