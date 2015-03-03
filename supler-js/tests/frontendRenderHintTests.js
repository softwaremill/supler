describe('frontend render hints', function() {
  it('should allow specifying simple render hints for top-level fields', function() {
    // given
    var sf = new Supler.Form(container, {
      field_options: {
        'field2': {
          'render_hint': 'password'
        }
      }
    });

    // when
    sf.render(data.simple1.form1);

    // then
    byName('field1').attr('type').should.equal('text');
    byName('field2').attr('type').should.equal('password');
  });

  it('should allow specifying complex render hints for top-level fields', function() {
    // given
    var sf = new Supler.Form(container, {
      field_options: {
        'field2': {
          'render_hint': {
            'name': 'textarea',
            'rows': 10,
            'cols': 20
          }
        }
      }
    });

    // when
    sf.render(data.simple1.form1);

    // then
    byName('field2')[0].tagName.should.equal('TEXTAREA');
    byName('field2').attr('cols').should.equal('20');
  });

  it('should allow specifying render hints for all fields nested in subforms list', function() {
    // given
    var sf = new Supler.Form(container, {
      field_options: {
        'simples[].field2': {
          'render_hint': 'password'
        }
      }
    });

    // when
    sf.render(data.complexSubformsList.formListNonEmpty);

    // then
    byName('simples[0].field1').attr('type').should.equal('text');
    byName('simples[0].field2').attr('type').should.equal('password');

    byName('simples[1].field1').attr('type').should.equal('text');
    byName('simples[1].field2').attr('type').should.equal('password');
  });

  it('should allow specifying render hints for a single field nested in subforms list', function() {
    // given
    var sf = new Supler.Form(container, {
      field_options: {
        'simples[1].field2': {
          'render_hint': 'password'
        }
      }
    });

    // when
    sf.render(data.complexSubformsList.formListNonEmpty);

    // then
    byName('simples[0].field1').attr('type').should.equal('text');
    byName('simples[0].field2').attr('type').should.equal('text');

    byName('simples[1].field1').attr('type').should.equal('text');
    byName('simples[1].field2').attr('type').should.equal('password');
  });

  it('should render date field with bootstrap-datepicker decoration', function() {
    // given
    var sf = new Supler.Form(container, {});

    // when
    sf.render(data.simpleDate.dateform1);

    // then
    byName('field2').attr('class').should.contain('datepicker');
    byName('field2').attr('data-date-format').should.equal('yyyy-MM-dd');
    byName('field2').attr('data-provide').should.equal('datepicker');
  });

  it('should render date optional empty date field with bootstrap-datepicker decoration', function() {
    // given
    var sf = new Supler.Form(container, {});

    // when
    sf.render(data.simpleDate.dateform1);

    // then
    byName('field3').attr('class').should.contain('datepicker');
    byName('field3').attr('data-date-format').should.equal('yyyy-MM-dd');
    byName('field3').attr('data-provide').should.equal('datepicker');
  });

  it('should render date optional non-empty date field with bootstrap-datepicker decoration', function() {
    // given
    var sf = new Supler.Form(container, {});

    // when
    sf.render(data.simpleDate.dateform2);

    // then
    byName('field3').attr('class').should.contain('datepicker');
    byName('field3').attr('data-date-format').should.equal('yyyy-MM-dd');
    byName('field3').attr('data-provide').should.equal('datepicker');
  });
});
