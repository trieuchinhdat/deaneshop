// Hashes cannot be converted to another password algorithm without the password.
console.error('Use python3 scripts/prepare-first-admin.py --reset-password for each existing active staff email. This script emits no SQL and does not convert legacy hashes or plaintext exports.')
process.exitCode = 1
