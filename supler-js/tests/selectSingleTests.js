describe('selectSingle', function() {
  var selectLabelsWithoutEmptyValue = ['a', 'b', 'c'];
  var selectLabelsWithEmptyValue = ['', 'a', 'b', 'c'];

  var radioValuesWithoutEmptyValue = ['0', '1', '2'];

  describe('req', function () {
    it('when an option is selected, empty value should not be a choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form1req);

      // then
      var options = selectLabels('field1');
      options.should.have.members(selectLabelsWithoutEmptyValue);

      byName('field1').val().should.equal('1');
    });

    it('when no option is selected, empty value should be the default choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form2req);

      // then
      var options = selectLabels('field1');
      options.should.have.members(selectLabelsWithEmptyValue);

      byName('field1').val().should.equal('-1');
    });

    it('when no option is selected, client-side validation should fail', function () {
      // given
      var sf = new SuplerForm(container);
      sf.render(data.selectSingle.form2req);

      // when
      var result = sf.validate();

      // then
      result.should.equal(true);

      validationElementByName('field1').innerText.should.have.length.above(0);
    });

    it('when rendered as radio buttons and an option is selected, should contain no empty choice ', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form1reqRadio);

      // then
      var options = radioValues('field1');
      options.should.have.members(radioValuesWithoutEmptyValue);

      byName('field1', ':checked').val().should.equal('1');
    });

    it('when rendered as radio buttons and no option is selected, should contain no empty choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form2reqRadio);

      // then
      var options = radioValues('field1');
      options.should.have.members(radioValuesWithoutEmptyValue);

      byName('field1', ':checked').length.should.equal(0);
    });
  });

  describe('opt', function () {
    it('when an option is selected, empty value should also be a choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form1opt);

      // then
      var options = selectLabels('field1');
      options.should.have.members(selectLabelsWithEmptyValue);

      byName('field1').val().should.equal('1');
    });

    it('when no option is selected, empty value should be the default choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form2opt);

      // then
      var options = selectLabels('field1');
      options.should.have.members(selectLabelsWithEmptyValue);

      byName('field1').val().should.equal('-1');
    });

    it('when no option is selected, client-side validation should succeed', function () {
      // given
      var sf = new SuplerForm(container);
      sf.render(data.selectSingle.form2opt);

      // when
      var result = sf.validate();

      // then
      result.should.equal(false);
    });

    it('when rendered as radio buttons and an option is selected, should contain no empty choice ', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form1optRadio);

      // then
      var options = radioValues('field1');
      options.should.have.members(radioValuesWithoutEmptyValue);

      byName('field1', ':checked').val().should.equal('1');
    });

    it('when rendered as radio buttons and no option is selected, should contain no empty choice', function () {
      // given
      var sf = new SuplerForm(container);

      // when
      sf.render(data.selectSingle.form2optRadio);

      // then
      var options = radioValues('field1');
      options.should.have.members(radioValuesWithoutEmptyValue);

      byName('field1', ':checked').length.should.equal(0);
    });
  });
});
