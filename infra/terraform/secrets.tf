resource "random_password" "session" {
  length  = 48
  special = false
}

# ── Computed connection/signing secrets (Terraform owns the values) ───────────
locals {
  computed_secret_values = {
    DATABASE_URL   = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.address}:5432/${var.db_name}?sslmode=require"
    DIRECT_URL     = "postgresql://${var.db_username}:${random_password.db.result}@${aws_db_instance.this.address}:5432/${var.db_name}?sslmode=require"
    REDIS_URL      = "redis://${aws_elasticache_replication_group.this.primary_endpoint_address}:6379"
    SESSION_SECRET = random_password.session.result
  }
}

resource "aws_secretsmanager_secret" "computed" {
  for_each    = toset(local.computed_secret_names)
  name        = "${local.secret_prefix}/${each.value}"
  description = "Forge ${var.environment} — ${each.value} (managed by Terraform)"
  kms_key_id  = aws_kms_key.forge.arn
  tags        = { Name = each.value }
}

resource "aws_secretsmanager_secret_version" "computed" {
  for_each      = aws_secretsmanager_secret.computed
  secret_id     = each.value.id
  secret_string = local.computed_secret_values[each.key]
}

# ── External-credential secrets (empty containers; YOU fill the values) ───────
# A one-time placeholder version is written so the ECS task can resolve the ARN;
# real values you set via console/CLI are preserved (ignore_changes).
resource "aws_secretsmanager_secret" "external" {
  for_each    = toset(var.external_secret_names)
  name        = "${local.secret_prefix}/${each.value}"
  description = "Forge ${var.environment} — ${each.value} (fill manually; never in git)"
  kms_key_id  = aws_kms_key.forge.arn
  tags        = { Name = each.value }
}

resource "aws_secretsmanager_secret_version" "external_placeholder" {
  for_each      = aws_secretsmanager_secret.external
  secret_id     = each.value.id
  secret_string = "REPLACE_ME"

  lifecycle {
    ignore_changes = [secret_string]
  }
}

locals {
  # name -> ARN for every secret the server task injects.
  secret_arns = merge(
    { for k, s in aws_secretsmanager_secret.computed : k => s.arn },
    { for k, s in aws_secretsmanager_secret.external : k => s.arn },
  )
}
