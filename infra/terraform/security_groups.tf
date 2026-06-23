# Least-privilege security groups (CLAUDE.md §6):
#   alb   ← 443 from Cloudflare only      ecs ← alb on 3000/4000
#   rds   ← 5432 from ecs only            redis ← 6379 from ecs only

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "ALB ingress from Cloudflare on 443/80"
  vpc_id      = aws_vpc.this.id
  tags        = { Name = "${local.name}-alb" }
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  for_each          = toset(var.alb_allowed_cidrs)
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from Cloudflare"
  cidr_ipv4         = each.value
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  for_each          = toset(var.alb_allowed_cidrs)
  security_group_id = aws_security_group.alb.id
  description       = "HTTP (redirected to HTTPS) from Cloudflare"
  cidr_ipv4         = each.value
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "alb_all" {
  security_group_id = aws_security_group.alb.id
  description       = "All egress"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ── ECS tasks ────────────────────────────────────────────────────────────────
resource "aws_security_group" "ecs" {
  name        = "${local.name}-ecs"
  description = "ECS tasks: ingress from ALB on app ports"
  vpc_id      = aws_vpc.this.id
  tags        = { Name = "${local.name}-ecs" }
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb_client" {
  security_group_id            = aws_security_group.ecs.id
  description                  = "Client port from ALB"
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 3000
  to_port                      = 3000
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb_server" {
  security_group_id            = aws_security_group.ecs.id
  description                  = "Server port from ALB"
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 4000
  to_port                      = 4000
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "ecs_all" {
  security_group_id = aws_security_group.ecs.id
  description       = "All egress (NAT to internet, RDS, Redis)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ── RDS ──────────────────────────────────────────────────────────────────────
resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "Postgres 5432 from ECS only"
  vpc_id      = aws_vpc.this.id
  tags        = { Name = "${local.name}-rds" }
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_ecs" {
  security_group_id            = aws_security_group.rds.id
  description                  = "Postgres from ECS tasks"
  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

# ── Redis ────────────────────────────────────────────────────────────────────
resource "aws_security_group" "redis" {
  name        = "${local.name}-redis"
  description = "Redis 6379 from ECS only"
  vpc_id      = aws_vpc.this.id
  tags        = { Name = "${local.name}-redis" }
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_ecs" {
  security_group_id            = aws_security_group.redis.id
  description                  = "Redis from ECS tasks"
  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"
}
