describe('complexFieldTest', function() {
  it('should render, modify and serialize a complex field', function () {
    // given
    var sf = new Supler.Form(container, {
      field_options: {
        p: {
          render_options: {
            renderHtmlInput: function (inputType, value, options) {
              return Supler.HtmlUtil.renderTag('span', options,
                Supler.HtmlUtil.renderTag('input', { class: 'x-coord', type: 'number', value: value.x }) +
                Supler.HtmlUtil.renderTag('input', { class: 'y-coord', type: 'number', value: value.y })
              );
            }
          },
          read_value: function(element) {
            return {
              x: parseInt($('.x-coord', element).val()),
              y: parseInt($('.y-coord', element).val())
            }
          }
        }
      }
    });

    // when
    sf.render(data.complexObject.form1);

    // then
    $('.x-coord').val().should.equal('1');
    $('.y-coord').val().should.equal('2');

    // when
    byName('f').val('y');
    $('.x-coord').val('5');
    $('.y-coord').val('6');

    // then
    var serialized = sf.getValue();
    serialized.should.deep.equal(data.complexObject.obj_y_5_6);
  });
});
