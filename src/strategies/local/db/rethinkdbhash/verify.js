export default function verify(email, password, done) {
  this.db.users
    .filter(this.db.r.row('emails').contains({ address: email }))
    .limit(1)
    .run()
    .then(users => {
      const user = users[0];
      
      if (!users)
        return done(null, false);

      // TODO verify password
      done(null, user);
    }).catch(err => done(err));
}
