import chai from 'chai';

import resolvers from './resolvers';

const should = chai.should();

describe('apollo-passport - resolvers', () => {

  it('apDiscovery()', () => {
    const root = {
      self: {
        strategies: {
          facebook: {
            name: 'facebook',
            _verify: '[Function: bound oauth2verify]',
            _oauth2: {
              _clientId: '1241521512512',
              _clientSecret: 'asdasfasfasfasfasfasfasfasf',
              _baseSite: '',
              _authorizeUrl: 'https://www.facebook.com/dialog/oauth',
              _accessTokenUrl: 'https://graph.facebook.com/oauth/access_token',
              _accessTokenName: 'access_token',
              _authMethod: 'Bearer',
              _customHeaders: {},
              _useAuthorizationHeaderForGET: false
            },
            _callbackURL: 'http://localhost:3200/ap-auth/facebook',
            _scope: [ 'public_profile', 'email' ],
            _scopeSeparator: ',',
            _key: 'oauth2:www.facebook.com',
            _stateStore: {},
            _trustProxy: undefined,
            _passReqToCallback: undefined,
            _skipUserProfile: false,
            _profileURL: 'https://graph.facebook.com/v2.5/me',
            _profileFields: [
              'id',
              'email',
              'first_name',
              'middle_name',
              'last_name',
              'gender',
              'locale'
            ],
            _enableProof: undefined,
            _clientSecret: 'asdasfasfasfasfasfasfasfasf'
          }
        }
      }
    };

    resolvers.apDiscovery.services(root).should.deep.equal([
      {
        name: 'facebook',
        label: 'Facebook',
        type: 'oauth',
        clientId: '1241521512512',
        scope: 'public_profile,email',
        urlStart: 'https://www.facebook.com/dialog/oauth'
      }
    ]);
  });

  describe('apDiscovery.services()', () => {
    const context = { ROOT_URL: "ROOT_URL", authPath: "authPath" };
    resolvers.RootQuery.apDiscovery.call(context).should.deep.equal({
      ROOT_URL: context.ROOT_URL,
      authPath: context.authPath,
      self: context
    })
  });

});
