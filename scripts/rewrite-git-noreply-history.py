import os
import subprocess

name = "Simon Bach Jessen"
email = "59052984+bachjessen@users.noreply.github.com"
subprocess.run(["git", "config", "user.name", name], check=True)
subprocess.run(["git", "config", "user.email", email], check=True)
env_filter = f'''GIT_AUTHOR_NAME="{name}"
GIT_AUTHOR_EMAIL="{email}"
GIT_COMMITTER_NAME="{name}"
GIT_COMMITTER_EMAIL="{email}"
export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL'''
env = os.environ.copy()
env["FILTER_BRANCH_SQUELCH_WARNING"] = "1"
subprocess.run(
    ["git", "filter-branch", "-f", "--env-filter", env_filter, "--", "--all"],
    check=True,
    env=env,
)
