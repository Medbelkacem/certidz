variable "name_prefix" {
  description = "Prefix for bucket names."
  type        = string
}

variable "evidence_retention_days" {
  description = "Object-lock COMPLIANCE retention for the evidence bucket."
  type        = number
}

variable "replication_target" {
  description = "DR region/site for bucket replication. Empty disables replication."
  type        = string
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
