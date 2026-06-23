# ── Wire these into GitHub → Settings → Secrets and variables → Actions ───────
output "github_deploy_role_arn" {
  description = "→ secret AWS_DEPLOY_ROLE_ARN"
  value       = aws_iam_role.deploy.arn
}

output "private_subnet_ids_csv" {
  description = "→ variable PRIVATE_SUBNET_IDS (for the migration run-task)"
  value       = join(",", aws_subnet.private[*].id)
}

output "server_security_group_id" {
  description = "→ variable SERVER_SECURITY_GROUP_ID"
  value       = aws_security_group.ecs.id
}

output "ecs_cluster_name" {
  description = "→ variable ECS_CLUSTER (optional; matches the default)"
  value       = aws_ecs_cluster.this.name
}

output "server_service_name" {
  value = aws_ecs_service.server.name
}

output "client_service_name" {
  value = aws_ecs_service.client.name
}

# ── Endpoints & identifiers ───────────────────────────────────────────────────
output "alb_dns_name" {
  description = "Point the Cloudflare CNAME here (done automatically when manage_dns = true)."
  value       = aws_lb.this.dns_name
}

output "app_url" {
  value = var.app_origin
}

output "ecr_server_repository_url" {
  value = aws_ecr_repository.server.repository_url
}

output "ecr_client_repository_url" {
  value = aws_ecr_repository.client.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.this.address
}

output "redis_primary_endpoint" {
  value = aws_elasticache_replication_group.this.primary_endpoint_address
}

output "kms_key_arn" {
  value = aws_kms_key.forge.arn
}

output "alerts_sns_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "cloudtrail_name" {
  description = "AWS-API audit trail (empty when enable_cloudtrail = false)."
  value       = var.enable_cloudtrail ? aws_cloudtrail.this[0].name : ""
}

output "cloudtrail_s3_bucket" {
  value = var.enable_cloudtrail ? aws_s3_bucket.trail[0].id : ""
}

output "execution_role_arn" {
  value = aws_iam_role.execution.arn
}

output "server_task_role_arn" {
  value = aws_iam_role.server_task.arn
}

output "client_task_role_arn" {
  value = aws_iam_role.client_task.arn
}

output "secret_names" {
  description = "Secrets created under /forge/<env>/* — fill the external ones before first deploy."
  value       = [for n in local.all_secret_names : "${local.secret_prefix}/${n}"]
}

# Only populated when manage_dns = false — add these CNAMEs by hand to validate ACM.
output "acm_validation_records" {
  description = "ACM DNS-validation records (manual DNS mode)."
  value = var.manage_dns ? {} : {
    for dvo in aws_acm_certificate.this.domain_validation_options :
    dvo.domain_name => { name = dvo.resource_record_name, type = dvo.resource_record_type, value = dvo.resource_record_value }
  }
}
