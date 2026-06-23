# ──────────────────────────────────────────────────────────────────────────────
# AWS-API audit — CloudTrail. Records who did what in the AWS account (console +
# API), the layer the app's own AuditLog can't see. Multi-region, log-file
# validation on, streamed to CloudWatch Logs so security metric-filter alarms can
# email you (root usage, unauthorized calls) via the existing SNS topic.
#
# Set enable_cloudtrail = false if the account is already covered by an
# organization-level trail (avoids a duplicate trail + cost).
# ──────────────────────────────────────────────────────────────────────────────
variable "enable_cloudtrail" {
  description = "Provision a CloudTrail trail + S3 sink + security alarms. Disable if an org-level trail already covers this account."
  type        = bool
  default     = true
}

variable "cloudtrail_retention_days" {
  description = "CloudWatch Logs retention for the CloudTrail event stream."
  type        = number
  default     = 90
}

locals {
  ct_enabled   = var.enable_cloudtrail ? 1 : 0
  ct_bucket    = "forge-${var.environment}-cloudtrail-${local.account_id}"
  ct_trail_arn = "arn:aws:cloudtrail:${local.region}:${local.account_id}:trail/${local.name}-trail"
}

# ── S3 sink (versioned, encrypted, private) ───────────────────────────────────
resource "aws_s3_bucket" "trail" {
  count  = local.ct_enabled
  bucket = local.ct_bucket
  tags   = { Name = local.ct_bucket }
}

resource "aws_s3_bucket_versioning" "trail" {
  count  = local.ct_enabled
  bucket = aws_s3_bucket.trail[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "trail" {
  count  = local.ct_enabled
  bucket = aws_s3_bucket.trail[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "trail" {
  count                   = local.ct_enabled
  bucket                  = aws_s3_bucket.trail[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "trail" {
  count  = local.ct_enabled
  bucket = aws_s3_bucket.trail[0].id
  rule {
    id     = "expire-old-trail-logs"
    status = "Enabled"
    filter {}
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Required bucket policy: let CloudTrail check the ACL and write objects.
data "aws_iam_policy_document" "trail_bucket" {
  count = local.ct_enabled

  statement {
    sid     = "AWSCloudTrailAclCheck"
    actions = ["s3:GetBucketAcl"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    resources = [aws_s3_bucket.trail[0].arn]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.ct_trail_arn]
    }
  }

  statement {
    sid     = "AWSCloudTrailWrite"
    actions = ["s3:PutObject"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    resources = ["${aws_s3_bucket.trail[0].arn}/AWSLogs/${local.account_id}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [local.ct_trail_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "trail" {
  count  = local.ct_enabled
  bucket = aws_s3_bucket.trail[0].id
  policy = data.aws_iam_policy_document.trail_bucket[0].json
}

# ── CloudWatch Logs stream (so we can alarm on security events) ───────────────
resource "aws_cloudwatch_log_group" "trail" {
  count             = local.ct_enabled
  name              = "/aws/cloudtrail/forge-${var.environment}"
  retention_in_days = var.cloudtrail_retention_days
  tags              = { Name = "${local.name}-cloudtrail" }
}

data "aws_iam_policy_document" "trail_cwl_assume" {
  count = local.ct_enabled
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "trail_cwl" {
  count              = local.ct_enabled
  name               = "${local.name}-cloudtrail-cwl"
  assume_role_policy = data.aws_iam_policy_document.trail_cwl_assume[0].json
  tags               = { Name = "${local.name}-cloudtrail-cwl" }
}

resource "aws_iam_role_policy" "trail_cwl" {
  count = local.ct_enabled
  name  = "write-cloudtrail-logs"
  role  = aws_iam_role.trail_cwl[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "${aws_cloudwatch_log_group.trail[0].arn}:*"
    }]
  })
}

# ── The trail ─────────────────────────────────────────────────────────────────
resource "aws_cloudtrail" "this" {
  count          = local.ct_enabled
  name           = "${local.name}-trail"
  s3_bucket_name = aws_s3_bucket.trail[0].id

  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.trail[0].arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.trail_cwl[0].arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true
  }

  depends_on = [aws_s3_bucket_policy.trail]
  tags       = { Name = "${local.name}-trail" }
}

# ── Security alarms on AWS-API activity → SNS email ───────────────────────────
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  count          = local.ct_enabled
  name           = "${local.name}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.trail[0].name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name          = "RootAccountUsage"
    namespace     = "Forge/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  count               = local.ct_enabled
  alarm_name          = "${local.name}-root-account-usage"
  alarm_description   = "Root account was used to call the AWS API/console."
  namespace           = "Forge/${var.environment}"
  metric_name         = "RootAccountUsage"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  count          = local.ct_enabled
  name           = "${local.name}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.trail[0].name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name          = "UnauthorizedApiCalls"
    namespace     = "Forge/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  count               = local.ct_enabled
  alarm_name          = "${local.name}-unauthorized-api-calls"
  alarm_description   = "Spike in unauthorized/denied AWS API calls (possible misconfig or probing)."
  namespace           = "Forge/${var.environment}"
  metric_name         = "UnauthorizedApiCalls"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}
