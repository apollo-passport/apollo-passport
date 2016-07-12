export default function verify(email, password, done) {
  this.db.users
    .filter(this.db.r.row('emails').contains({ address: email }))
    .limit(1)
    .run()
    .then(users => {
      if (!users.length)
        return done(null, false);

      const user = users[0];
      this.comparePassword(password, user.password, (err, match) => {
        err ? done(err) : done(null, match ? user : false);
      });
    }).catch(err => done(err));
}
