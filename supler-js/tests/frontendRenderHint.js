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
});
