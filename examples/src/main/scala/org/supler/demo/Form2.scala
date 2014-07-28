package org.supler.demo

import org.supler.{ValidationError, Supler}
import Supler._

object Form2 {
  form[RegisterData](f => List(
    f.field(_.login)
      .label("Login")
      .validate(minLength(3)),
    f.field(_.passwd)
      .label("Password:")
      .validate(minLength(8)),
    f.field(_.confirmPasswd).label("Confirm password:")
      .validate(custom((e, v) => v == e.passwd, (e, v) => ValidationError("Passwords must match!")))
  ))
}

class RegisterData(
  var login: String,
  var passwd: String,
  var confirmPasswd: String)
