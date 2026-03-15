# 路由设计

## AccountManager
- 前端到后端：req_user_signup, req_user_login
- 后端到前端：ack_login_result, evt_account_info

## LevelManager
- 前端到后端：req_room_list, req_join_room, req_leave_room, req_send_lobby_chat, req_chat_history
- 后端到前端：ack_room_list, ack_join_room, ack_leave_room, evt_update_lobby_chat, ack_chat_history

## Level
- 前端到后端：req_update_input, req_send_interact, req_send_end_turn_ready
- 后端到前端：ack_update_input, ack_send_interact, ack_send_end_turn_ready,

- 后端到前端：evt_send_game_context
- 后端到前端：evt_send_message_context, evt_update_message_context

- 前端到后端：req_send_game_chat

## Manage Notify
- 后端到前端：evt_send_notify, evt_send_alert, evt_send_effect



- 以 req 前缀的消息表示路由是客户端请求
- 以 ack 前缀的消息表示路由是服务器对客户端请求的响应
- 以 evt 前缀的消息表示路由是服务器主动发送给客户端的事件通知

# 对 Operation Lock 的描述
在客户端中，有保证在用户操作后禁用用户操作，直到其收到服务器的响应。这使用 OperationLock 表示。

在服务端中，OperationLock 被自动管理，在服务器响应发回前保持锁定状态，响应发回后自动解锁。

