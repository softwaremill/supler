package org

package object supler {
  type ValuesProvider[T, U] = T => List[U]
}
