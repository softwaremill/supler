describe('customize render', function() {
  after(function(){
    container.innerHTML = '';
  });

  describe('using templates', function() {
    it('should use an input template for the specified text field', function () {
      // given
      container.innerHTML = document.getElementById('templates_oneinput_text').innerHTML;

      // when
      var sf = new Supler.Form(container);
      sf.render(data.simple1.form1);

      // then
      byName('field1').attr('customattr').should.equal('z');
      assert.equal(byName('field2').attr('customattr'), null);
    });

    it('should use an input template for the specified button', function () {
      // given
      container.innerHTML = document.getElementById('templates_oneinput_button').innerHTML;

      var state = 1;

      function sendForm() {
        state = 2;
      }

      var sf = new Supler.Form(container, {
        send_form_function: sendForm
      });

      // when
      sf.render(data.actionSimple.formOneActionValidateNone);

      // then
      byName('addx').attr('customattr').should.equal('custombutton');
      byName('addx').click();
      state.should.equal(2);
    });

    it('should use an input template for the specified boolean field', function () {
      // given
      container.innerHTML = document.getElementById('templates_oneinput_boolean').innerHTML;

      // when
      var sf = new Supler.Form(container);
      sf.render(data.simple1.form1);

      var serialized1 = sf.getValue();
      var validate1 = sf.validate();

      byName('field4').prop('checked', function (i, val) {
        return i === 0;
      });

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

  describe('using javascript', function() {
    it('should use a javascript override for rendering the specified field', function() {
      // when
      var sf = new Supler.Form(container, {
        field_options: {
          'field1': {
            'render_options': {
              'renderLabel': function (forId, label) {
                return '<div id="id193812">some label</div>';
              }
            }
          }
        }
      });
      sf.render(data.simple1.form1);

      // then
      $('#id193812').text().should.equal('some label');
      byName('field1').val().should.equal('v1'); // the field should still be rendered normally
    });

    it('should use a javascript override for rendering fields with the given render hint', function() {
      // when
      var sf = new Supler.Form(container, {
        field_options: {
          'render_hint:date': {
            'render_options': {
              'renderLabel': function (forId, label) {
                return '<div id="id193813">date label</div>';
              }
            }
          }
        }
      });
      sf.render(data.simpleDate.dateform1);

      // then


      $('#id193813').text().should.equal('date label');
      byName('field1').val().should.equal('dv1'); // the field should still be rendered normally
    })
  });
});
