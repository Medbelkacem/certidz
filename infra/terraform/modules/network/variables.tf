variable "name_prefix" {
  description = "Prefix for all network resource names (e.g. certidz-production)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block of the VPC / private network."
  type        = string
}

variable "availability_zones" {
  description = "Zones to spread subnets across."
  type        = list(string)
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
