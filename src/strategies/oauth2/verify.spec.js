import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import 'regenerator-runtime/runtime';

import verify from './verify';

const should = chai.should();
chai.use(sinonChai);

describe('apollo-passport - strategies - oauth2 - verify', () => {

  it('warns if strategy != provider', () => {
    sinon.spy(console, 'warn');

    const context = {
      db: {
        // Short circuit everything else for this test.
        fetchUserByServiceIdOrEmail() {
          return { then() { return { catch() {} }} };
        }
      }
    };

    verify.call(context, "strategy", null, null, { provider: 'not-strategy'} );

    console.warn.should.have.been.called.once;
    console.warn.restore();
  });

  it('correctly infers and sets values before calling fetchUserByServiceIdOrEmail', () => {
    const context = {
      db: {
        // Short circuit everything else for this test.
        fetchUserByServiceIdOrEmail() {
          return { then() { return { catch() {} }} };
        }
      }
    };
    sinon.spy(context.db, 'fetchUserByServiceIdOrEmail');

    verify.call(context, "strategy", "accessToken", "refreshToken", {
      id: 'profileId',
      provider: "provider",
      emails: [ { value: "me@me.com" } ]
    });

    context.db.fetchUserByServiceIdOrEmail.should.have.been.calledWith(
      "provider",
      "profileId",
      "me@me.com"
    );
  });

  describe('correctly handles fetched user data', () => {

    it('creates a user if not returned (without email)', (done) => {
      const profile = { id: 'profileId', provider: 'provider' };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then(null); // i.e. no user found
                return { catch() {} }}
            }
          }
        },
        createUser(user) {
          return {
            then(func) { func("userId"); return { catch() {} }}
          }
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        user.should.deep.equal({
          emails: [],
          services: {
            provider: profile
          },
          id: "userId"
        });
        done();
      });
    });

    it('creates a user if not returned (email)', (done) => {
      const profile = {
        id: 'profileId', provider: 'provider',
        emails: [ { value: 'me@me.com' } ]
      };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then(null); // i.e. no user found
                return { catch() {} }}
            }
          }
        },
        createUser(user) {
          return {
            then(func) { func("userId"); return { catch() {} }}
          }
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        user.should.deep.equal({
          emails: [ { address: "me@me.com" } ],
          services: {
            provider: profile
          },
          id: "userId"
        });
        done();
      });
    });

    it('adds provider profile if data if it didn\'t exist before', (done) => {
      const profile = { id: 'profileId', provider: 'provider', something: true };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then({
                  id: "userId",
                  emails: [ { address: "me@me.com" } ],
                  services: {}
                });
                return { catch() {} }}
            }
          },
          assertUserServiceData: sinon.spy()
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        context.db.assertUserServiceData.should.have.been.calledWith(
          "userId", "provider", profile
        );

        user.should.deep.equal({
          emails: [ { address: "me@me.com" } ],
          services: {
            provider: profile
          },
          id: "userId"
        });

        done();
      });
    });

    it('updates provider profile if data has changed', (done) => {
      const profile = { id: 'profileId', provider: 'provider', something: true };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then({
                  id: "userId",
                  emails: [ { address: "me@me.com" } ],
                  services: { provider: { ...profile, something: false } }
                });
                return { catch() {} }}
            }
          },
          assertUserServiceData: sinon.spy()
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        context.db.assertUserServiceData.should.have.been.calledWith(
          "userId", "provider", profile
        );

        user.should.deep.equal({
          id: "userId",
          emails: [ { address: "me@me.com" } ],
          services: { provider: profile }
        });

        done();
      });
    });

    it('adds email address if it didn\t exist before', (done) => {
      const profile = {
        id: 'profileId', provider: 'provider',
        emails: [ { value: 'me2@me.com' } ]
      };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then({
                  id: "userId",
                  emails: [ { address: "me@me.com" } ],
                  services: { provider: profile }
                });
                return { catch() {} }}
            }
          },
          assertUserServiceData() {},
          assertUserEmailData: sinon.spy()
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        context.db.assertUserEmailData.should.have.been.calledWith(
          "userId", "me2@me.com"
        );

        user.emails.should.deep.equal([
          { address: "me@me.com" },
          { address: "me2@me.com" }
        ]);

        done();
      });
    });

    it('adds email address if it didn\t exist before (and user had no emails)', (done) => {
      const profile = {
        id: 'profileId', provider: 'provider',
        emails: [ { value: 'me2@me.com' } ]
      };
      const context = {
        db: {
          fetchUserByServiceIdOrEmail(provider, id, email) {
            return {
              then(then) {
                then({ id: "userId", services: { provider: profile } });
                return { catch() {} }}
            }
          },
          assertUserServiceData() {},
          assertUserEmailData: sinon.spy()
        }
      };

      verify.call(context, "provider", "accessToken", null, profile, (err, user) => {
        context.db.assertUserEmailData.should.have.been.calledWith("userId", "me2@me.com");
        user.emails.should.deep.equal([ { address: "me2@me.com" } ]);
        done();
      });
    });

  });

});
