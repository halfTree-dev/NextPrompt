# 路由设计

## AccountManager
- 前端到后端：req_user_signup, req_user_login
- 后端到前端：ack_login_result, evt_account_info

## LevelManager
- 前端到后端：req_room_list, req_join_room, req_leave_room, req_send_lobby_chat, req_chat_history
- 后端到前端：ack_room_list, ack_join_room, ack_leave_room, evt_update_lobby_chat, ack_chat_history

## Level
- 前端到后端：req_update_input, req_send_interact,
- 后端到前端：ack_update_input, ack_send_interact,
> update_input 同时传输节点选择和文本输入

- 后端到前端：evt_send_game_context
- 后端到前端：evt_send_message_context, evt_update_message_context

- 前端到后端：req_send_game_chat

## Manage Notify
- 后端到前端：evt_send_notify, evt_send_alert, evt_send_effect

## Manage EndTurn
- 前端到后端：req_end_turn
- 后端到前端：ack_end_turn, evt_end_turn_result
- 后端到前端：evt_next_round

## Manage Cancel Op Lock
- 后端到前端：*evt_cancel_op_lock*


- 以 req 前缀的消息表示路由是客户端请求
- 以 ack 前缀的消息表示路由是服务器对客户端请求的响应
- 以 evt 前缀的消息表示路由是服务器主动发送给客户端的事件通知

# 对 Operation Lock 的描述
在客户端中，有保证在用户操作后禁用用户操作，直到其收到服务器的响应。这使用 OperationLock 表示。

在服务端中，OperationLock 被自动管理，在服务器响应发回前保持锁定状态，响应发回后自动解锁。


# TODO:
1. 完成 OpLock 的后端校验，实际上应当仅需对关键操作（send_interact, input）校验，因为这些操作会调用 LLM ，代价很大。
2. 完成文档 VitePress 的移植，修改旧的文档使其符合目前逻辑
3. 完成 OpLock 和 EndTurn 的前端动画效果
4. 将旧版项目中的 LLM Tools 设定和相关逻辑移植到新版项目中
6. 写故事脚本
7. 为故事脚本设计一套有意思的战斗系统
8. 上线，测试

# perfs:
1. 优化 popup 和各类 notify，使其显示信息不过多
2. 优化 logger 输出，避免过多无用信息干扰日志阅读
3. 增添新手引导故事脚本
4. 对新用户提供引导教程
5. 为游戏添加可选的动态背景，增强游戏氛围
6. 完成节点菜单中节点拖动移动位置
