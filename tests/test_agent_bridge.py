import importlib.util
import os
from pathlib import Path
from types import SimpleNamespace

import pytest


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('agent_bridge', ROOT / 'ops/agent-bridge/run.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)


def payload(repo=bridge.REPO):
    issue = {'number': 42, 'title': 'Test', 'body': 'Owner task', 'state': 'open',
             'user': {'login': 'frost831'}, 'labels': [{'name': 'agent:mac'}]}
    event = {'sender': {'login': 'frost831'},
             'repository': {'full_name': repo, 'private': True},
             'issue': dict(issue), 'action': 'opened'}
    return event, issue


def test_owner_task_can_run_only_on_selected_machine():
    event, issue = payload()
    assert bridge.authorized_event(event, 'issues', 'mac', issue)
    assert not bridge.authorized_event(event, 'issues', 'pc', issue)


def test_splashlens_repos_are_explicitly_scoped_by_machine():
    event, issue = payload('frost831/poolens')
    event['repository']['private'] = False
    assert bridge.authorized_event(event, 'issues', 'mac', issue)
    issue['labels'] = [{'name': 'agent:pc'}]
    event['issue'] = dict(issue)
    assert bridge.authorized_event(event, 'issues', 'pc', issue)

    event, issue = payload('frost831/poolens-site')
    event['repository']['private'] = False
    assert not bridge.authorized_event(event, 'issues', 'mac', issue)
    issue['labels'] = [{'name': 'agent:pc'}]
    event['issue'] = dict(issue)
    assert bridge.authorized_event(event, 'issues', 'pc', issue)


def test_nonowner_public_and_changed_scope_are_rejected():
    for field in ('sender', 'public', 'changed', 'author', 'closed', 'pull_request'):
        event, issue = payload()
        if field == 'sender': event['sender'] = {'login': 'someone-else'}
        if field == 'public': event['repository']['private'] = False
        if field == 'changed': issue['body'] = 'Edited while queued'
        if field == 'author': issue['user'] = {'login': 'someone-else'}
        if field == 'closed': issue['state'] = 'closed'
        if field == 'pull_request': issue['pull_request'] = {'url': 'PR'}
        assert not bridge.authorized_event(event, 'issues', 'mac', issue), field


def test_duplicate_running_done_and_ambiguous_labels_do_not_execute():
    for label in ('agent:running', 'agent:done', 'agent:failed', 'agent:pc'):
        event, issue = payload()
        issue['labels'] = [*issue['labels'], {'name': label}]
        assert not bridge.authorized_event(event, 'issues', 'mac', issue)


def test_only_explicit_owner_comment_can_continue():
    event, issue = payload()
    issue['labels'].append({'name': 'agent:done'})
    event['comment'] = {'user': {'login': 'frost831'}, 'body': '/codex continue'}
    assert bridge.authorized_event(event, 'issue_comment', 'mac', issue)
    event['comment']['body'] = 'ordinary reply'
    assert not bridge.authorized_event(event, 'issue_comment', 'mac', issue)
    event['comment'] = {'user': {'login': 'other'}, 'body': '/codex malicious'}
    assert not bridge.authorized_event(event, 'issue_comment', 'mac', issue)


def test_manual_dispatch_requires_exact_issue_and_target():
    event, issue = payload()
    event['inputs'] = {'issue': '42', 'machine': 'mac'}
    assert bridge.authorized_event(event, 'workflow_dispatch', 'mac', issue)
    event['inputs']['issue'] = '43'
    assert not bridge.authorized_event(event, 'workflow_dispatch', 'mac', issue)


def test_merge_never_skips_primary_ci_or_waiting_checks():
    assert not bridge.checks_passed([])
    assert not bridge.checks_passed([{'name': 'verify', 'bucket': 'skipping'}])
    assert not bridge.checks_passed([{'name': 'verify', 'bucket': 'pass'}, {'name': 'security', 'bucket': 'pending'}])
    assert bridge.checks_passed([{'name': 'verify', 'bucket': 'pass'}])


def test_workflow_trust_and_queue_boundaries():
    workflow = (ROOT / '.github/workflows/agent-bridge.yml').read_text()
    assert workflow.count("github.event.sender.login == 'frost831'") == 2
    assert workflow.count('queue: max') == 2
    assert 'frost831/poolens' in workflow
    assert 'frost831/poolens-site' in workflow
    assert '${{ github.repository }}-agent-pc' in workflow
    assert 'persist-credentials: false' in workflow
    assert 'pull_request_target' not in workflow
    assert '${{ github.event.issue.body }}' not in workflow


def test_staged_credentials_are_not_pushed(monkeypatch):
    monkeypatch.setattr(bridge, 'execute', lambda *a, **k: SimpleNamespace(stdout='auth.json\n'))
    with pytest.raises(RuntimeError, match='Credential'):
        bridge.assert_no_staged_secrets(ROOT, {})


def test_potential_token_content_is_not_pushed(monkeypatch):
    outputs = iter(['config.py\n', '+TOKEN = "ghp_' + 'A' * 36 + '"\n'])
    monkeypatch.setattr(bridge, 'execute', lambda *a, **k: SimpleNamespace(stdout=next(outputs)))
    with pytest.raises(RuntimeError, match='Potential secret'):
        bridge.assert_no_staged_secrets(ROOT, {})


def test_poolens_mac_tasks_are_path_limited(monkeypatch):
    outputs = iter(['ios/App/AppDelegate.swift\nREADME.md\n', ''])
    monkeypatch.setattr(bridge, 'execute', lambda *a, **k: SimpleNamespace(stdout=next(outputs)))
    with pytest.raises(RuntimeError, match='outside allowed paths'):
        bridge.assert_repo_policy(ROOT, {}, 'frost831/poolens', 'mac')


def test_poolens_mac_allows_ios_and_android_twa(monkeypatch):
    outputs = iter(['ios/App/AppDelegate.swift\nandroid-twa/app/build.gradle\n', ''])
    monkeypatch.setattr(bridge, 'execute', lambda *a, **k: SimpleNamespace(stdout=next(outputs)))
    bridge.assert_repo_policy(ROOT, {}, 'frost831/poolens', 'mac')


def test_store_upload_automation_changes_are_blocked(monkeypatch):
    outputs = iter(['ios/Fastfile\n', '+  upload_to_testflight\n'])
    monkeypatch.setattr(bridge, 'execute', lambda *a, **k: SimpleNamespace(stdout=next(outputs)))
    with pytest.raises(RuntimeError, match='Store upload'):
        bridge.assert_repo_policy(ROOT, {}, 'frost831/poolens', 'mac')


def test_retry_branches_are_unique():
    assert bridge.task_branch('42', 'Test title', '123', '1') != bridge.task_branch('42', 'Test title', '123', '2')


def test_followup_preserves_one_owned_task_pr():
    pr = {'headRefName': 'agent/42-test-123-1', 'isCrossRepository': False,
          'author': {'login': 'frost831'}, 'body': 'Refs #42', 'url': 'https://github.com/pr'}
    assert bridge.continuation_pr([pr], '42') == pr
    assert bridge.continuation_pr([pr], '4') is None
    with pytest.raises(RuntimeError, match='Multiple'):
        bridge.continuation_pr([pr, pr], '42')
    for change in ({'isCrossRepository': True}, {'author': {'login': 'other'}}, {'body': 'Refs #420'}):
        with pytest.raises(RuntimeError, match='ownership'):
            bridge.continuation_pr([{**pr, **change}], '42')


def test_authentication_precedes_private_fetch(monkeypatch):
    calls = []
    monkeypatch.setattr(bridge, 'execute', lambda args, **kwargs: (calls.append(args) or SimpleNamespace(stdout='sha')))
    bridge.create_isolated_checkout(ROOT, ROOT / 'unused-test-path', 'master', 'test-branch', {})
    auth = next(i for i, args in enumerate(calls) if 'credential.helper' in args)
    fetch = next(i for i, args in enumerate(calls) if args[:2] == ['git', 'fetch'])
    assert auth < fetch


def test_no_change_continuation_can_finish_existing_pr(monkeypatch):
    calls = []
    monkeypatch.setattr(bridge, 'gh', lambda args, **kwargs: calls.append(args))
    monkeypatch.setattr(bridge, 'execute', lambda args, **kwargs: SimpleNamespace(
        stdout='abc123' if args[0] == 'git' else '[{"name":"verify","bucket":"pass"}]'))
    bridge.finish_pr('pr-url', {'complete': True, 'allow_merge': True}, {'isDraft': True}, ROOT, {})
    assert calls == [['pr', 'ready', 'pr-url'], ['pr', 'merge', 'pr-url', '--squash', '--match-head-commit', 'abc123']]
    source = (ROOT / 'ops/agent-bridge/run.py').read_text()
    assert '\n        finish_pr(pr_url, result, previous, worktree, env)' in source


def test_git_auth_is_repeatable_with_existing_multiple_helpers(tmp_path):
    env = os.environ.copy()
    env['GIT_CONFIG_NOSYSTEM'] = '1'
    env['GIT_CONFIG_GLOBAL'] = str(tmp_path / 'empty-global')
    bridge.execute(['git', 'init', str(tmp_path)], env=env)
    for helper in ('manager', 'old-helper'):
        bridge.execute(['git', 'config', '--add', 'credential.helper', helper], cwd=tmp_path, env=env)
    for _ in range(3):
        bridge.configure_git_auth(tmp_path, env)
        helpers = bridge.execute(['git', 'config', '--get-all', 'credential.helper'], cwd=tmp_path, env=env).stdout.splitlines()
        assert helpers == ['', '!gh auth git-credential']
