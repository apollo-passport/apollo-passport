import chai from 'chai';

import ApolloPassport from './index';

const should = chai.should();

const requiredOptions = () => ({
  jwtSecret: 'MYSECRET',
  db: { createUser: true, fetchUserByEmail: true }
});

describe('apollo-passport', () => {

  describe('constructor()', () => {

    it('requires a valid db driver instance', () => {
      const options = requiredOptions();

      (function() {
        new ApolloPassport(options);
      }).should.not.throw();

      (function() {
        delete options.db;
        new ApolloPassport(options);
      }).should.throw();

      (function() {
        options.db = {};
        new ApolloPassport(options);
      }).should.throw();
    });

  });
  
});