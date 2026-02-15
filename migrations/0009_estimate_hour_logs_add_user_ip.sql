-- 推算時辰紀錄表新增 user_ip，供同 IP 多帳號異常分析（階段三 3.1）
ALTER TABLE estimate_hour_logs ADD COLUMN user_ip TEXT;
