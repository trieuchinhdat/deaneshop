#!/usr/bin/env python3
"""Prepare guarded first-admin setup locally; never connect to remote D1."""

import getpass
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import sys
import secrets


def main():
    root = Path(__file__).resolve().parent.parent
    reset_password = '--reset-password' in sys.argv
    if reset_password and '--sanity' in sys.argv:
        raise ValueError('Không kết hợp --reset-password với --sanity.')
    if any(arg not in ('--sanity', '--reset-password') for arg in sys.argv[1:]):
        raise ValueError('Dùng không có cờ để tạo admin password; --reset-password để đặt mật khẩu staff có sẵn; --sanity cho chế độ Sanity.')
    email = input('Email đăng nhập: ').strip().lower()
    name = '' if reset_password else input('Tên hiển thị: ').strip()
    if len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise ValueError('Email không hợp lệ.')
    if not reset_password and (not name or len(name) > 200):
        raise ValueError('Tên phải có từ 1 đến 200 ký tự.')

    if '--sanity' in sys.argv:
        password_hash = 'sanity-only:' + secrets.token_hex(32)
    else:
        password = getpass.getpass('Mật khẩu (nhập kín): ')
        if len(password) < 12 or len(password.encode('utf-8')) > 72:
            raise ValueError('Mật khẩu cần ít nhất 12 ký tự và tối đa 72 byte UTF-8.')
        if password != getpass.getpass('Nhập lại mật khẩu: '):
            raise ValueError('Hai mật khẩu không khớp.')

        # Pass the password through stdin, never process arguments or shell history.
        result = subprocess.run(
            ['node', '-e', "const {hashPassword}=require('./shared/password-hash.mjs'); let s=''; "
             "process.stdin.setEncoding('utf8'); process.stdin.on('data',c=>s+=c); "
             "process.stdin.on('end',async()=>{try{process.stdout.write(await hashPassword(JSON.parse(s)))}"
             "catch{process.exitCode=1}})"],
            input=json.dumps(password), text=True, capture_output=True, cwd=root,
        )
        if result.returncode or not re.fullmatch(r'scrypt\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}', result.stdout):
            raise RuntimeError('Không tạo được scrypt hash. Kiểm tra Node >=22.12 và shared/password-hash.mjs.')
        password_hash = result.stdout

    def quote(value):
        return "'" + value.replace("'", "''") + "'"

    guard = ("WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE role='superadmin')\n"
             "ON CONFLICT(email) DO UPDATE SET role='superadmin',full_name=excluded.full_name,updated_at=CURRENT_TIMESTAMP "
             "WHERE admin_users.status='active' AND NOT EXISTS (SELECT 1 FROM admin_users WHERE role='superadmin');\n"
             if '--sanity' in sys.argv else
             'WHERE NOT EXISTS (SELECT 1 FROM admin_users);\n')
    sql = (
        f"INSERT INTO admin_users (id,email,password_hash,full_name,role,status)\n"
        f"SELECT 'admin-root',{quote(email)},{quote(password_hash)},{quote(name)},"
        f"'superadmin','active'\n"
        + guard +
        'SELECT changes() AS created;\n'
    )
    if reset_password:
        sql = (
            f"UPDATE admin_users SET password_hash={quote(password_hash)},updated_at=CURRENT_TIMESTAMP "
            f"WHERE email={quote(email)} AND status='active';\n"
            'SELECT changes() AS updated;\n'
        )
    directory = root / 'backups'
    directory.mkdir(exist_ok=True)
    target = directory / ('reset-admin-password.sql' if reset_password else 'first-admin.sql')
    # Write a private file atomically, including when replacing a previous attempt.
    descriptor, temporary = tempfile.mkstemp(prefix='.first-admin-', dir=directory)
    try:
        with os.fdopen(descriptor, 'w') as output:
            output.write(sql)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(f'Đã tạo backups/{target.name} (chỉ chứa hash, quyền 0600).')
    if reset_password:
        print('Chưa ghi D1. UPDATE chỉ đặt mật khẩu cho đúng email staff active đã có; không đổi role hoặc kích hoạt lại tài khoản.')
    elif '--sanity' in sys.argv:
        print('Chưa ghi D1. Chỉ tạo/nâng quyền email đã chọn khi chưa có superadmin; không thay identity hoặc password của staff đang có.')
        print('Sau created: 1, đăng nhập bằng đúng email qua provider đã cấu hình. Không cần password ứng dụng.')
    else:
        print('Chưa ghi vào D1. INSERT chỉ chạy khi bảng admin_users hoàn toàn trống.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError) as error:
        raise SystemExit(str(error))
    except (EOFError, KeyboardInterrupt):
        raise SystemExit('\nĐã hủy; chưa ghi vào D1.')
