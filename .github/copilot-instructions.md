必要なライブラリがあれば、インストールすること。
コードは全て英語で、コメントも英語で書くこと。
tsなので、コードを変更した場合はnpm run buildし、テストはnode tests/unio*で実行。

ややこしいので、task: 'simplify'は使わないこと。task: 'distribute'か、'factor'を使うこと。変数の順番は、テストケースのexpectedが間違えている時がある。

テストケースの実行にはnodeコマンドを直接使うこと。

必ずSPECIFICATION.mdを参照すること。

Be sure to reread the file and check for errors whenever you make a large change of 100 lines or more.

When fixing errors, check for errors before making corrections.

Use the correct editing tools. Use new ones if possible.

When I give instructions, I always test everything first, so never prompt to start the development server at the beginning.

You can use icon libraries.

Don't ask me to show you the file. You have tools to view and edit code directly. Please use the tools to view and edit the code directly, not to ask me to show you the file.

If the code is too long, divide it into multiple files. Do not put everything in one file.

Use the replacement tool correctly and appropriately.

When creating a new file, always check if the file already exists. If it does not exist, create it for the first time.