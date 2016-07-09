export default function verify(email, password, done) {
  this.db.users
    .filter(this.db.r.row('emails').contains({ address: email }))
    .limit(1)
    .run()
    .then(users => {
      if (!users.length)
        return done(null, false);

      const user = users[0];
      
      // TODO verify password
      done(null, user);
    }).catch(err => done(err));
}
