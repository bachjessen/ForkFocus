# ForkFocus deployment

1. Create Mozilla Add-ons API credentials.
2. Export `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` in the current shell.
3. Run `python3 scripts/sign-forkfocus.py`.
4. Run `python3 scripts/deploy-twilight.py`.
5. Restart Twilight and verify `about:policies` and `about:addons`.

The signed XPI is copied to `~/Library/Application Support/ForkFocus/forkfocus.xpi`. Twilight receives an `ExtensionSettings` policy using `normal_installed`, so ForkFocus can be disabled.

The policy is stored inside `/Applications/Twilight.app`. This changes a sealed app resource and Twilight updates may remove it, so rerun deployment after an update.
