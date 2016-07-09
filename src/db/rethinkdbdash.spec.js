import RethinkDBHashDriver from './rethinkdbdash';
import chai from 'chai';
chai.should();

describe('RethinkDBDashDriver', () => {

  describe('constructor', () => {

    it('instantiates with an instance and table name', () => {

      const instance = {
        table(userTableName) { return userTableName; }
      };
      const userTableName = 'users';

      const db = new RethinkDBHashDriver(instance, userTableName);

      db.r.should.equal(instance);
      db.users.should.equal(userTableName);
    });

  });

});
