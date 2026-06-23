variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set false if the account already has one (only one per URL is allowed) and pass its ARN below."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "ARN of an existing GitHub OIDC provider (used when create_github_oidc_provider = false)."
  type        = string
  default     = ""
}

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# ── ECS task execution role (pull images, inject secrets, write logs) ─────────
resource "aws_iam_role" "execution" {
  name               = "forge-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = { Name = "forge-ecs-execution-role" }
}

data "aws_iam_policy_document" "execution" {
  statement {
    sid       = "EcrAuthToken"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"] # AWS forbids resource-scoping this action
  }
  statement {
    sid = "PullOwnImagesOnly"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
    ]
    resources = [aws_ecr_repository.server.arn, aws_ecr_repository.client.arn]
  }
  statement {
    sid       = "InjectOwnSecretsOnly"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.secret_prefix}/*"]
  }
  statement {
    sid       = "DecryptOwnCmk"
    actions   = ["kms:Decrypt"]
    resources = [aws_kms_key.forge.arn]
  }
  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.server.arn}:*", "${aws_cloudwatch_log_group.client.arn}:*"]
  }
}

resource "aws_iam_role_policy" "execution" {
  name   = "forge-ecs-execution"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.execution.json
}

# ── Server task role (runtime perms: secrets, KMS, logs, optional SES) ────────
resource "aws_iam_role" "server_task" {
  name               = "forge-server-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = { Name = "forge-server-task-role" }
}

data "aws_iam_policy_document" "server_task" {
  statement {
    sid       = "ReadOwnSecretsOnly"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = ["arn:aws:secretsmanager:${local.region}:${local.account_id}:secret:${local.secret_prefix}/*"]
  }
  statement {
    sid       = "UseAppCmk"
    actions   = ["kms:Decrypt", "kms:GenerateDataKey"]
    resources = [aws_kms_key.forge.arn]
  }
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.server.arn}:*"]
  }
  dynamic "statement" {
    for_each = var.ses_identity_domain == "" ? [] : [var.ses_identity_domain]
    content {
      sid       = "SendEmailViaSES"
      actions   = ["ses:SendEmail", "ses:SendRawEmail"]
      resources = ["arn:aws:ses:${local.region}:${local.account_id}:identity/${statement.value}"]
    }
  }
}

resource "aws_iam_role_policy" "server_task" {
  name   = "forge-server-task"
  role   = aws_iam_role.server_task.id
  policy = data.aws_iam_policy_document.server_task.json
}

# ── Client task role (logs only — the client holds no secrets) ────────────────
resource "aws_iam_role" "client_task" {
  name               = "forge-client-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
  tags               = { Name = "forge-client-task-role" }
}

data "aws_iam_policy_document" "client_task" {
  statement {
    sid       = "WriteOwnLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.client.arn}:*"]
  }
}

resource "aws_iam_role_policy" "client_task" {
  name   = "forge-client-task"
  role   = aws_iam_role.client_task.id
  policy = data.aws_iam_policy_document.client_task.json
}

# ── GitHub Actions OIDC → deploy role (no static keys) ────────────────────────
resource "aws_iam_openid_connect_provider" "github" {
  count           = var.create_github_oidc_provider ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcc"]
  tags            = { Name = "github-actions-oidc" }
}

locals {
  oidc_provider_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn
}

data "aws_iam_policy_document" "deploy_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:${var.github_deploy_ref}"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "forge-github-deploy-role"
  assume_role_policy = data.aws_iam_policy_document.deploy_assume.json
  tags               = { Name = "forge-github-deploy-role" }
}

data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid = "EcrPushPull"
    actions = [
      "ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage",
      "ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories", "ecr:CreateRepository", "ecr:TagResource",
      "ecr:PutLifecyclePolicy", "ecr:DescribeImages",
    ]
    resources = ["arn:aws:ecr:${local.region}:${local.account_id}:repository/forge-*"]
  }
  statement {
    sid       = "EcsTaskDefRegister"
    actions   = ["ecs:RegisterTaskDefinition", "ecs:DeregisterTaskDefinition", "ecs:DescribeTaskDefinition"]
    resources = ["*"] # these actions do not support resource-level scoping
  }
  statement {
    sid = "EcsDeployScopedToCluster"
    actions = [
      "ecs:UpdateService", "ecs:DescribeServices", "ecs:RunTask",
      "ecs:DescribeTasks", "ecs:ListTasks", "ecs:StopTask", "ecs:DescribeClusters",
    ]
    resources = ["*"]
    condition {
      test     = "ArnEquals"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.this.arn]
    }
  }
  statement {
    sid       = "PassTaskRoles"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.execution.arn, aws_iam_role.server_task.arn, aws_iam_role.client_task.arn]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "forge-github-deploy"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}
