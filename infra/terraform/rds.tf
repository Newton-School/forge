resource "random_password" "db" {
  length  = 32
  special = false # keep the password URL-safe (no escaping in DATABASE_URL)
}

resource "aws_db_subnet_group" "this" {
  name       = "${local.name}-db"
  subnet_ids = aws_subnet.private[*].id
  tags       = { Name = "${local.name}-db" }
}

# Force TLS on every connection (Prisma uses sslmode=require).
resource "aws_db_parameter_group" "this" {
  name   = "${local.name}-pg"
  family = "postgres${split(".", var.db_engine_version)[0]}"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
  tags = { Name = "${local.name}-pg" }
}

resource "aws_db_instance" "this" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.forge.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  db_subnet_group_name   = aws_db_subnet_group.this.name
  parameter_group_name   = aws_db_parameter_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.db_multi_az
  port                   = 5432

  backup_retention_period      = 7
  auto_minor_version_upgrade   = true
  performance_insights_enabled = true
  deletion_protection          = var.db_deletion_protection
  skip_final_snapshot          = false
  final_snapshot_identifier    = "${local.name}-postgres-final"
  apply_immediately            = false

  tags = { Name = "${local.name}-postgres" }
}
