package org.supler

import org.scalatest.{FlatSpec, ShouldMatchers}

class FieldPathTest extends FlatSpec with ShouldMatchers {
  val serializeData = List(
    (EmptyPath, ""),
    (EmptyPath.append("f"), "f"),
    (EmptyPath.append("f").append("g"), "f.g"),
    (EmptyPath.append("f").append("g").append("h"), "f.g.h"),
    (EmptyPath.appendWithIndex("f", 10).append("g"), "f[10].g"),
    (EmptyPath.appendWithIndex("f", 10).appendWithIndex("g", 9), "f[10].g[9]")
  )

  for ((path, expectedResult) <- serializeData) {
    it should s"serialize $path into $expectedResult" in {
      path.toString should be (expectedResult)
    }
  }

  var childOfData = List(
    (EmptyPath, EmptyPath, true),
    (EmptyPath.append("f"), EmptyPath.append("f"), true),
    (EmptyPath.append("f").append("g"), EmptyPath.append("f").append("g"), true),
    (EmptyPath.append("f"), EmptyPath, true),
    (EmptyPath, EmptyPath.append("f"), false),
    (EmptyPath.append("f").append("g"), EmptyPath.append("f"), true),
    (EmptyPath.append("f"), EmptyPath.append("f").append("g"), false),
    (EmptyPath.append("field10"), EmptyPath.append("field1"), false),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.append("field"), true),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.appendWithIndex("field", 9), true),
    (EmptyPath.appendWithIndex("field", 9), EmptyPath.appendWithIndex("field", 8), false),
    (EmptyPath.appendWithIndex("field", 9).append("g"), EmptyPath.appendWithIndex("field", 9), true)
  )

  for ((path, candidateParent, expectedResult) <- childOfData) {
    it should s"check if $path is a child of $candidateParent, returning $expectedResult" in {
      path.childOf(candidateParent) should be (expectedResult)
    }
  }
}
