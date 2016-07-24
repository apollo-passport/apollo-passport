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

  const error = new Error('test error');
  context.error = null;

  context.comparePassword = function(pass1, pass2, cb) {
    if (context.error)
      cb(context.error);
    else
      cb(null, pass1 === pass2);
  };

  before(async () => {
    await freshUserTable();
    await db.users.insert([
      {
        id: "user1",
        emails: [
          { address: "test@test.com" }
        ],
        password: "test123"
      }
    ]).run();
  });

  it('should catch rethinkdb errors and pass to callback', (done) => {

    // Super simple API that satisfied the query in verify.js but rejects.
    context.db = {
      filter: () => context.db,
      limit: () => context.db,
      r: {
        row: () => context.db
      },
      contains: () => context.db.users,
      run() {
        return new Promise((resolve, reject) => {
          reject(error);
        });
      }
    };
    context.db.users = context.db;

    verify("foo", "bar", (err, user) => {
      err.should.equal(error);
      should.equal(user, undefined);
      context.db = db; // reset for next test
      done();
    });

  });

  it('should fail on no matching email', (done) => {

    verify("non-existing-email", "test123", (err, user) => {
      should.equal(user, false /*, "Invalid email" */);
      done();
    });

  });

  it('should fail on no matching password', (done) => {

    verify("test@test.com", "non-matching-password", (err, user) => {
      should.equal(user, false /*, "Invalid password" */);
      done();
    });

  });

  it('should call cb(err) on a thrown error', (done) => {

    context.error = error;
    verify("test@test.com", "test123", (err, user) => {
      err.should.equal(error);
      should.equal(user, undefined);
      context.error = null; // reset for next test
      done();
    });

  });

  it('return a matching user with verified password', (done) => {

    verify("test@test.com", "test123", (err, user) => {
      user.id.should.equal("user1");
      done();
    });

  });

});
