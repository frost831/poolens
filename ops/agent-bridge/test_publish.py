"""Publish-stage tests: local disposable Git repos, mocked gh."""
import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('bridge', Path(__file__).with_name('run.py'))
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


class Publish(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.env = os.environ.copy()
        self.env.update(GIT_CONFIG_GLOBAL=str(root / 'g'), GIT_CONFIG_NOSYSTEM='1')
        self.origin = root / 'origin.git'
        self.work = root / 'work'
        self.git('init', '--bare', '-b', 'main', self.origin)
        self.git('clone', self.origin, self.work)
        self.git('config', 'user.name', 'F', cwd=self.work)
        self.git('config', 'user.email', 'f@example.invalid', cwd=self.work)
        (self.work / 'a.txt').write_text('a\n')
        self.git('add', '.', cwd=self.work); self.git('commit', '-m', 'init', cwd=self.work)
        self.git('push', 'origin', 'HEAD:main', cwd=self.work)
        self.git('switch', '-c', 'agent/1-x', cwd=self.work)

    def tearDown(self):
        self.tmp.cleanup()

    def git(self, *args, cwd=None):
        return subprocess.run(['git', *map(str, args)], cwd=cwd, env=self.env, check=True,
                              capture_output=True, text=True).stdout.strip()

    def run_publish(self, previous=None, **kw):
        warnings = []
        url = bridge.publish(self.work, self.env, number='1', title='X', base='main',
                             remote_branch=kw.get('remote_branch', 'agent/1-x'), previous=previous,
                             body='b', complete=True, warnings=warnings)
        return url, warnings

    def test_nothing_to_commit_skips_push_and_pr(self):
        with patch.object(bridge, 'gh') as remote:
            url, _ = self.run_publish()
        self.assertIsNone(url); remote.assert_not_called()
        self.assertEqual(self.git('ls-remote', '--heads', 'origin', cwd=self.work).count('agent/'), 0)

    def test_existing_remote_branch_pushes_suffixed_without_force(self):
        self.git('push', 'origin', 'main:refs/heads/agent/1-x', cwd=self.work)
        (self.work / 'b.txt').write_text('b\n')
        with patch.object(bridge, 'gh', return_value='https://pr/2') as remote, \
                patch.object(bridge, 'open_pr_for', return_value=None):
            url, _ = self.run_publish()
        self.assertEqual(url, 'https://pr/2')
        self.assertIn('agent/1-x-r1', remote.call_args[0][0])
        heads = self.git('ls-remote', '--heads', 'origin', cwd=self.work)
        self.assertIn('agent/1-x-r1', heads)

    def test_open_pr_is_commented_not_recreated(self):
        (self.work / 'b.txt').write_text('b\n')
        with patch.object(bridge, 'gh') as remote, patch.object(bridge, 'open_pr_for', return_value='https://pr/9'):
            url, _ = self.run_publish()
        self.assertEqual(url, 'https://pr/9')
        self.assertEqual(remote.call_args[0][0][:2], ['pr', 'comment'])

    def test_non_fast_forward_continuation_goes_to_suffixed_branch(self):
        self.git('push', 'origin', 'HEAD:refs/heads/agent/1-x', cwd=self.work)
        other = Path(self.tmp.name) / 'other'
        self.git('clone', '-b', 'agent/1-x', self.origin, other)
        self.git('-c', 'user.name=o', '-c', 'user.email=o@x.invalid', 'commit', '--allow-empty', '-m', 'race', cwd=other)
        self.git('push', 'origin', 'agent/1-x', cwd=other)
        (self.work / 'b.txt').write_text('b\n')
        with patch.object(bridge, 'gh', return_value='https://pr/3'), patch.object(bridge, 'open_pr_for', return_value=None):
            url, warnings = self.run_publish(previous={'url': 'https://pr/1'})
        self.assertEqual(url, 'https://pr/3')
        self.assertTrue(any('agent/1-x-r1' in w for w in warnings))
        # Remote race commit was not overwritten.
        self.assertEqual(self.git('log', '-1', '--format=%s', 'origin/agent/1-x', cwd=other), 'race')

    def test_stale_lock_removed_and_detached_head_recovered(self):
        self.git('checkout', '--detach', cwd=self.work)
        (self.work / '.git' / 'index.lock').write_text('')
        (self.work / 'b.txt').write_text('b\n')
        with patch.object(bridge, 'git_process_running', return_value=False), \
                patch.object(bridge, 'gh', return_value='https://pr/4'), patch.object(bridge, 'open_pr_for', return_value=None):
            url, _ = self.run_publish()
        self.assertEqual(url, 'https://pr/4')
        self.assertFalse((self.work / '.git' / 'index.lock').exists())

    def test_held_lock_is_not_removed(self):
        (self.work / '.git' / 'index.lock').write_text('')
        with patch.object(bridge, 'git_process_running', return_value=True), self.assertRaisesRegex(RuntimeError, 'index.lock'):
            self.run_publish()
        self.assertTrue((self.work / '.git' / 'index.lock').exists())


class Logging(unittest.TestCase):
    def test_failure_log_is_redacted(self):
        result = SimpleNamespace(returncode=128, stdout='',
                                 stderr='fatal: https://x-access-token:ghs_abcdefghijklmnopqrstuvwx@github.com/a/b rejected')
        with patch.object(bridge.subprocess, 'run', return_value=result), \
                patch('sys.stderr') as err, self.assertRaises(bridge.CommandError):
            bridge.execute(['git', 'push', 'https://u:ghp_secretsecretsecret1234@github.com/a', '--body', 'private'])
        logged = ''.join(str(c.args[0]) for c in err.write.call_args_list)
        self.assertIn('rejected', logged)
        for secret in ('ghs_abcdefghijklmnop', 'ghp_secretsecret', 'private'):
            self.assertNotIn(secret, logged)


if __name__ == '__main__':
    unittest.main()
