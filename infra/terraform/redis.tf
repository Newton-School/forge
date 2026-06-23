resource "aws_elasticache_subnet_group" "this" {
  name       = "${local.name}-redis"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name}-redis" }
}

# Single-node Redis (cluster mode disabled) for server-side sessions + cache.
# At-rest encryption uses the Forge CMK. Transit encryption is left off so the
# app connects with a plain redis:// URL (no auth token) — enable it + an auth
# token later if you want rediss://.
resource "aws_elasticache_replication_group" "this" {
  replication_group_id = "${local.name}-redis"
  description          = "Forge ${var.environment} sessions/cache"

  engine             = "redis"
  engine_version     = var.redis_engine_version
  node_type          = var.redis_node_type
  num_cache_clusters = 1
  port               = 6379

  subnet_group_name  = aws_elasticache_subnet_group.this.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = false
  multi_az_enabled           = false

  at_rest_encryption_enabled = true
  kms_key_id                 = aws_kms_key.forge.arn
  transit_encryption_enabled = false

  apply_immediately = true
  tags              = { Name = "${local.name}-redis" }
}
