package org.supler

object Util {
  def findFirstMapped[T, U](coll: Iterable[T], map: T => U, suchThat: U => Boolean): Option[U] = {
    val it = coll.iterator
    while (it.hasNext) {
      val el = it.next()
      val mapped = map(el)
      if (suchThat(mapped)) return Some(mapped)
    }

    None
  }
}
