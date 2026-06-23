# Dedicated Forge CMK — encrypts RDS storage and Secrets Manager values.
# Key policy grants the account root full admin (so you can never lock yourself
# out); day-to-day access (kms:Decrypt / GenerateDataKey) is governed by the
# scoped IAM policies on the ECS roles (iam.tf). Keeping role ARNs OUT of the key
# policy avoids a key<->role dependency cycle.
resource "aws_kms_key" "forge" {
  description             = "Forge ${var.environment} CMK (RDS + Secrets Manager)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AccountRootFullAdmin"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      }
    ]
  })

  tags = { Name = "${local.name}-cmk" }
}

resource "aws_kms_alias" "forge" {
  name          = "alias/forge-${var.environment}"
  target_key_id = aws_kms_key.forge.key_id
}
