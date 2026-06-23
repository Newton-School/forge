# CloudWatch log groups for the two services (awslogs driver targets these).
resource "aws_cloudwatch_log_group" "server" {
  name              = "/ecs/forge/${var.environment}/server"
  retention_in_days = var.log_retention_days
  tags              = { Name = "${local.name}-server-logs" }
}

resource "aws_cloudwatch_log_group" "client" {
  name              = "/ecs/forge/${var.environment}/client"
  retention_in_days = var.log_retention_days
  tags              = { Name = "${local.name}-client-logs" }
}
