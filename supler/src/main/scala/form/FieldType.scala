package form

sealed trait FieldType {
  def jsonSchemaName: String
}

case object StringFieldType extends FieldType {
  val jsonSchemaName = "string"
}

case object IntegerFieldType extends FieldType {
  val jsonSchemaName = "integer"
}

case object RealFieldType extends FieldType {
  val jsonSchemaName = "number"
}

case object BooleanFieldType extends FieldType {
  val jsonSchemaName = "boolean"
}
