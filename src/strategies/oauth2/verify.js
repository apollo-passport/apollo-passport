import _ from 'lodash';

/* Sample data

accessToken: "EAAFvTvnWMmIBAOjoduxXVU1N8yOSnPxbKlWAeZACieV5tjXJ5s4XnvHlDyc7IvnN30ZC6EV8pv4B9SY6ONE7IulGtzI4XeMbqYAorO6oV4ktwJi8DHcUoTccSkaoo89lwvZBtLOXydx2myOeAsHBKBJ6vlPaioZD"
refreshToken: "undefined"
profile: { id: '123456',
  username: undefined,
  displayName: 'John Sheppard',
  name:
   { familyName: undefined,
     givenName: undefined,
     middleName: undefined },
  gender: undefined,
  profileUrl: undefined,
  emails: [ { value: 'sheppard@atlantis.net' } ],
  provider: 'facebook',
  _raw: '{"id":"123456","name":"John Sheppard","email":"sheppard\\u0040atlantis.net"}',
  _json:
   { id: '123456',
     name: 'Gadi Cohen',
     email: 'dragon@wastelands.net' }
}
*/

export default function oauth2verify(strategy, accessToken, refreshToken, profile, cb) {
  // console.log('profile', profile);

  const provider = profile.provider;
  if (strategy !== provider)
    console.warn('[harmless warn for dev] oauth2verify, '
      + `strategy "${strategy}" !== provider "${provider}"`);

  // This is not really a "verification" but we want to store it in the database
  profile.accessToken = accessToken;
  if (refreshToken) profile.refreshToken = refreshToken;

  // support multiple email addresses?  needs DB support.  do any providers do this?
  const email = profile.emails && profile.emails[0] && profile.emails[0].value;

  // TODO double check if DB driver if email is null that all works as expected
  this.db.fetchUserByServiceIdOrEmail(provider, profile.id, email).then(user => {

    if (!user) {
      user = { emails: [], services: { [provider]: profile } };
      if (email)
        user.emails.push({ address: email });

      return this.createUser(user).then(userId => {
        this.setUserIdProp(user, userId);
        return cb(null, user);
      }).catch(cb);
    }

    // if we're out of date, update in the background (i.e. no await)
    if (!user.services[provider]
        || JSON.stringify(user.services[provider]) !== JSON.stringify(profile)) {

      this.db.assertUserServiceData(this.userId(user), provider, profile);
      user.services[provider] = profile;
    }
    if (!user.emails) user.emails = [];
    if (email && (!_.find(user.emails, { address: email }))) {
      this.db.assertUserEmailData(this.userId(user), email);
      user.emails.push({ address: email });
    }

    cb(null, user);
  }).catch(cb);
}
