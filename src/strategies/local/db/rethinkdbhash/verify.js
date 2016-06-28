export default function verify(email, password, done) {
  this.db.users.filter(
    this.db.r.row('emails').contains({ address: email })
  ).limit(1).run().then(user => {

    console.log(email, password, user);

    if (!user)
      done(null, false);

    if (user)
      done(null, user);

  }).catch(err => done(err));
}
