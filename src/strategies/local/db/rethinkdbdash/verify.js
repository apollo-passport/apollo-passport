export default function verify(email, password, done) {
  this.db.users
    .filter(this.db.r.row('emails').contains({ address: email }))
    .limit(1)
    .run()
    .then(users => {
      if (!users.length)
        return done(null, false, "Invalid email");

      const user = users[0];
      this.comparePassword(password, user.password, (err, match) => {
        if (err)
          done(err);
        else if (match)
          done(null, user);
        else
          done(null, false, "Invalid password");
      });
    }).catch(err => done(err));
}
