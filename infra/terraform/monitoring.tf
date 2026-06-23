variable "alert_email" {
  description = "Email address that receives operational alerts (ECS crashes, 5xx spikes, server error logs, RDS/Redis pressure). Empty = create the topic+alarms but no email subscription."
  type        = string
  default     = "learnercareercouncil@nst.rishihood.edu.in"
}

# All alarms publish here; the email subscription must be confirmed once (AWS
# sends a confirmation link after the first apply).
resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
  tags = { Name = "${local.name}-alerts" }
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ── App error logs → metric → alarm (emails you when the server logs error/fatal)
# pino emits JSON with numeric levels: error=50, fatal=60.
resource "aws_cloudwatch_log_metric_filter" "server_errors" {
  name           = "${local.name}-server-errors"
  log_group_name = aws_cloudwatch_log_group.server.name
  pattern        = "{ $.level >= 50 }"

  metric_transformation {
    name          = "ServerErrorLogs"
    namespace     = "Forge/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "server_error_logs" {
  alarm_name          = "${local.name}-server-error-logs"
  alarm_description   = "Server logged one or more error/fatal lines in 5 min."
  namespace           = "Forge/${var.environment}"
  metric_name         = "ServerErrorLogs"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ── ECS: a service running fewer tasks than desired = crash/rollout failure ───
resource "aws_cloudwatch_metric_alarm" "server_running_tasks" {
  alarm_name          = "${local.name}-server-running-tasks-low"
  alarm_description   = "Server running task count below desired (crash loop or failed deploy)."
  namespace           = "ECS/ContainerInsights"
  metric_name         = "RunningTaskCount"
  dimensions          = { ClusterName = aws_ecs_cluster.this.name, ServiceName = aws_ecs_service.server.name }
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.server_desired_count
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "client_running_tasks" {
  alarm_name          = "${local.name}-client-running-tasks-low"
  alarm_description   = "Client running task count below desired."
  namespace           = "ECS/ContainerInsights"
  metric_name         = "RunningTaskCount"
  dimensions          = { ClusterName = aws_ecs_cluster.this.name, ServiceName = aws_ecs_service.client.name }
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.client_desired_count
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ── ALB: 5xx from targets + unhealthy hosts ───────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-target-5xx"
  alarm_description   = "Elevated 5xx responses from app targets."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_Target_5XX_Count"
  dimensions          = { LoadBalancer = aws_lb.this.arn_suffix }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 10
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "server_unhealthy_hosts" {
  alarm_name          = "${local.name}-server-unhealthy-hosts"
  alarm_description   = "Server target group has unhealthy hosts."
  namespace           = "AWS/ApplicationELB"
  metric_name         = "UnHealthyHostCount"
  dimensions          = { LoadBalancer = aws_lb.this.arn_suffix, TargetGroup = aws_lb_target_group.server.arn_suffix }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ── RDS pressure ──────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${local.name}-rds-cpu-high"
  alarm_description   = "RDS CPU sustained high."
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  dimensions          = { DBInstanceIdentifier = aws_db_instance.this.identifier }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${local.name}-rds-storage-low"
  alarm_description   = "RDS free storage below 2 GiB."
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  dimensions          = { DBInstanceIdentifier = aws_db_instance.this.identifier }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 2147483648 # 2 GiB in bytes
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

# ── Redis pressure ────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "${local.name}-redis-cpu-high"
  alarm_description   = "Redis CPU sustained high."
  namespace           = "AWS/ElastiCache"
  metric_name         = "EngineCPUUtilization"
  dimensions          = { ReplicationGroupId = aws_elasticache_replication_group.this.replication_group_id }
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  threshold           = 85
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
