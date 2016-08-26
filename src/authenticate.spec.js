import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import apAuthenticate from './authenticate';

const should = chai.should();
chai.use(chaiAsPromised);

describe('apollo-passport - apAuthenticate', () => {

  const context = {
    createTokenFromUser: () => 'token',
    _authenticators: {
      FakePassing(req, res, next) {
        req.logIn({ id: 1 }, {}, next);
      },
      FakeFailing(req, res, next) {
        next();
      }
    }
  }

  it('rejects on missing strategy', () => {
    return apAuthenticate.call(context, 'missing').should.reject;
  });

  it('resolves with a token on success', () => {
    return apAuthenticate.call(context, 'FakePassing').should.become({
      type: 'loginComplete',
      key: 'oauth2',
      data: {
        oauth2: {
          token: 'token',
          error: ''
        }
      }
    });
  });

  it('resolves with an error on auth failure', () => {
    return apAuthenticate.call(context, 'FakeFailing').should.become({
      type: 'loginComplete',
      key: 'oauth2',
      data: {
        oauth2: {
          token: '',
          error: 'Authentication Failed'
        }
      }
    });
  });

});
