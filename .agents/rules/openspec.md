# OpenSpec 兼容说明

`lina-tapcanvas`不使用 OpenSpec。本文件只用于阻止继承自 LinaPro 上游的旧入口被误启用，不是产品开发流程的事实来源。

- 不创建、更新、校验或归档 OpenSpec 变更。
- 不执行`/opsx:*`命令，也不把`openspec/`内容作为需求、任务、验证、PR 或交付门禁。
- 不因本机安装了`openspec`命令而自动启用任何流程。
- 产品开发流程统一遵守`.agents/rules/workflow.md`、冻结 Tasklist 和阶段执行记录。
- 上游 OpenSpec workflow、skill、prompt 和归档内容在产品完成清理前只视为非活动兼容残留。
