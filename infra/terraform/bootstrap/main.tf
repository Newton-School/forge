# ──────────────────────────────────────────────────────────────────────────────
# State-backend bootstrap — run ONCE, before the main module.
#
# Creates the S3 bucket (VERSIONED + encrypted + public-access-blocked) and the
# DynamoDB table used for Terraform remote state + state locking. This is a
# SEPARATE root module with LOCAL state on purpose: the bucket that stores remote
# state cannot store the state of the run that creates it (chicken-and-egg).
#
#   cd infra/terraform/bootstrap
#   terraform init && terraform apply -var=aws_region=ap-south-1
#
# Then init the main module against it:
#   cd ..
#   terraform init \
#     -backend-config="bucket=$(terraform -chdir=bootstrap output -raw state_bucket)" \
#     -backend-config="dynamodb_table=$(terraform -chdir=bootstrap output -raw lock_table)" \
#     -backend-config="key=forge/prod/terraform.tfstate" \
#     -backend-config="region=ap-south-1"
# ──────────────────────────────────────────────────────────────────────────────
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      app       = "forge"
      ManagedBy = "terraform"
      component = "tf-state-backend"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "state_bucket_name" {
  description = "Globally-unique S3 bucket name for Terraform state. Defaults to forge-tfstate-<account-id>."
  type        = string
  default     = ""
}

variable "lock_table_name" {
  type    = string
  default = "forge-tflock"
}

data "aws_caller_identity" "current" {}

locals {
  bucket = var.state_bucket_name != "" ? var.state_bucket_name : "forge-tfstate-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket" "state" {
  bucket = local.bucket

  # Refuse accidental deletion of the bucket holding all infra state.
  lifecycle {
    prevent_destroy = true
  }
}

# VERSIONING — keep every prior state revision (recover from a bad apply).
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Expire noncurrent state versions after 90 days so versioning doesn't grow forever.
resource "aws_s3_bucket_lifecycle_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    id     = "expire-noncurrent-state"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# DynamoDB STATE LOCK table (LockID hash key is the Terraform-required schema).
resource "aws_dynamodb_table" "lock" {
  name         = var.lock_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

output "state_bucket" {
  value = aws_s3_bucket.state.id
}

output "lock_table" {
  value = aws_dynamodb_table.lock.name
}
