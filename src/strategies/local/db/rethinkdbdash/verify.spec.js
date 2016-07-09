import chai from 'chai';
import 'regenerator-runtime/runtime';

import RethinkDBHashDriver from '../../../../db/rethinkdbdash';
import r, { freshUserTable } from '../../../../db/rethinkdbdash-instance';

import _verify from './verify';

const should = chai.should();

describe('Strategies - local - db - rethinkdbdash - verify', () => {

  const context = {};
  const verify = _verify.bind(context);
  const db = context.db = new RethinkDBHashDriver(r, "users");

  before(async () => {
    await freshUserTable();
    await db.users.insert([
      {
        id: "user1",
        emails: [
          { address: "test@test.com" }
        ]
      }
    ]).run();
  });

  it('finds a user by email and verifies password', (done) => {

    verify("test@test.com", "test123", (err, user) => {
      user.id.should.equal("user1");
      done();
    });

  });

  it('should fail on no matching email', (done) => {

    verify("non-existing-email", "test123", (err, user) => {
      should.equal(user, false);
      done();
    });

  });

});
