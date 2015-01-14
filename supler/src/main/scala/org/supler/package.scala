package org

package object supler extends IdentityType {
  type ValuesProvider[T, U] = T => List[U]
}

trait IdentityType {
  type Id[T] = T
}