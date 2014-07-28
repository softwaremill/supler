package form

sealed trait FieldType

case object StringFieldType extends FieldType

case object IntegerFieldType extends FieldType

case object RealFieldType extends FieldType

case object BooleanFieldType extends FieldType
