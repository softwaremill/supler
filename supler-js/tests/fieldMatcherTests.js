describe('matchers by', function() {
  describe('path', function() {
    it('should match exact paths', function() {
      var m1 = new PathFieldMatcher('field1');
      m1.matches('field1', null, null).should.be.true();
      m1.matches('field2', null, null).should.be.false();

      var m2 = new PathFieldMatcher('field1.subfield1');
      m2.matches('field1.subfield1', null, null).should.be.true();
      m2.matches('field1.subfield2', null, null).should.be.false();
      m2.matches('field2.subfield1', null, null).should.be.false();
      m2.matches('field1', null, null).should.be.false();

      var m3 = new PathFieldMatcher('field1[1].subfield1');
      m3.matches('field1[1].subfield1', null, null).should.be.true();
      m3.matches('field1[0].subfield1', null, null).should.be.false();
      m3.matches('field1[1].subfield2', null, null).should.be.false();
      m3.matches('field2[1].subfield1', null, null).should.be.false();
      m3.matches('field1[1]', null, null).should.be.false();
    });

    it('should match single-level subforms lists', function () {
      var m1 = new PathFieldMatcher('field1[].subfield1');
      m1.matches('field1[].subfield1', null, null).should.be.true();
      m1.matches('field1[0].subfield1', null, null).should.be.true();
      m1.matches('field1[1].subfield1', null, null).should.be.true();
      m1.matches('field1[0].subfield2', null, null).should.be.false();
      m1.matches('field1[1].subfield2', null, null).should.be.false();
      m1.matches('field2[0].subfield1', null, null).should.be.false();
      m1.matches('field1[0]', null, null).should.be.false();
    });

    it('should match multi-level subforms lists', function () {
      var m1 = new PathFieldMatcher('field1[].subfield1[].subsubfield1');
      m1.matches('field1[0].subfield1[1].subsubfield1', null, null).should.be.true();
      m1.matches('field1[2].subfield1[0].subsubfield1', null, null).should.be.true();
      m1.matches('field1[2].subfield1[0].subsubfield2', null, null).should.be.false();
      m1.matches('field1[2].subfield2[0].subsubfield1', null, null).should.be.false();
      m1.matches('field1[2].subfield2[0]', null, null).should.be.false();
    });
  });

});
