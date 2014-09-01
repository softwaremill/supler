package org.supler.demo

import org.supler.Supler
import Supler._
import org.supler.validation.ValidationError

object RegisterDataForm {
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
