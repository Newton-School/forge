data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.aws_region
  env        = var.environment
  prefix     = "forge"
  name       = "forge-${var.environment}"

  # forge.taj.works — host portion of the public origin.
  app_fqdn = replace(replace(var.app_origin, "https://", ""), "http://", "")

  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)

  # /24 public + /24 private subnets carved from the VPC CIDR, one pair per AZ.
  public_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 100)]

  ecr_server = "forge-server"
  ecr_client = "forge-client"

  secret_prefix = "/forge/${var.environment}"

  # Connection/signing secrets Terraform computes and manages end-to-end.
  computed_secret_names = ["DATABASE_URL", "DIRECT_URL", "REDIS_URL", "SESSION_SECRET"]
  all_secret_names      = concat(local.computed_secret_names, var.external_secret_names)

  tags = {
    app       = "forge"
    env       = var.environment
    ManagedBy = "terraform"
  }
}
