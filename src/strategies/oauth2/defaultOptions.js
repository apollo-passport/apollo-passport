// TODO standard pull from db...

export default {
  clientID: '403859966407266',
  clientSecret: 'fd3ec904596e0b775927a1052a3f7165',
  callbackURL: "http://localhost:3200/ap-auth/facebook",
  // https://developers.facebook.com/docs/graph-api/reference/v2.5/user
  profileFields: [
    'id', 'email', 'pussy',
    'first_name', 'middle_name', 'last_name',
    'gender', 'locale'
  ]
}
