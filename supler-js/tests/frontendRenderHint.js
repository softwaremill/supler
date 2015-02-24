describe('frontend render hints', function() {
  it('should allow specifying render hints for top-level fields', function() {
    // given
    var sf = new SuplerForm(container, {
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

  it('should allow specifying render hints for all fields nested in subforms list', function() {
    // given
    var sf = new SuplerForm(container, {
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
    var sf = new SuplerForm(container, {
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
});
