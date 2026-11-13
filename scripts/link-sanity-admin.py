#!/usr/bin/env python3
"""Prepare an explicit identity link for an existing active staff account; no remote I/O."""
import os
from pathlib import Path
import re
import tempfile


def main():
    email = input('Email tài khoản D1 hiện có: ').strip().lower()
    identity = input('Sanity Account ID đã xác minh (chỉ recovery): ').strip()
    if len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise ValueError('Email không hợp lệ.')
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', identity):
        raise ValueError('Sanity Account ID không hợp lệ.')
    quote = lambda value: "'" + value.replace("'", "''") + "'"
    sql = (
        f"UPDATE admin_users SET sanity_user_id={quote(identity)}, updated_at=CURRENT_TIMESTAMP "
        f"WHERE lower(email)={quote(email)} AND status='active' "
        f"AND (sanity_user_id IS NULL OR sanity_user_id={quote(identity)}) "
        f"AND NOT EXISTS (SELECT 1 FROM admin_users WHERE sanity_user_id={quote(identity)} AND lower(email)!={quote(email)});\n"
        'SELECT changes() AS linked;\n'
    )
    directory = Path(__file__).resolve().parent.parent / 'backups'
    directory.mkdir(exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix='.sanity-link-', dir=directory)
    try:
        with os.fdopen(descriptor, 'w') as output:
            output.write(sql)
        os.replace(temporary, directory / 'link-sanity-admin.sql')
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print('Đã tạo backups/link-sanity-admin.sql (0600). Chưa ghi D1; không đổi role/mật khẩu.')


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        raise SystemExit(str(error))
    except (EOFError, KeyboardInterrupt):
        raise SystemExit('\nĐã hủy; chưa ghi D1.')
