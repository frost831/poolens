"""Offline failure-path contracts; GitHub, Codex, Git and OS queries are mocked."""
import ast
import contextlib
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('hardening_bridge', Path(__file__).with_name('run.py'))
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
REPO = 'frost831/'+Path(__file__).resolve().parents[2].name


def simulate(*, publication_failure=False, check_failure=False, complete=True,
             report_failure=False, changed_scope=False):
    calls, prompts = [], []
    issue = {'number':125,'title':'Fixture task','body':'Original task','state':'open',
             'user':{'login':'frost831'},'labels':[{'name':'agent:pc'}]}
    comment = {'id':1,'created_at':'2026-10-29T00:00:00Z','updated_at':'2026-10-29T00:00:00Z',
               'user':{'login':'frost831'},'body':'Latest correction: do not rebuild; PR-only'}
    event = {'sender':{'login':'frost831'},'repository':{'full_name':REPO,'private':True},
             'inputs':{'issue':'125','machine':'pc'}}
    result = {'summary':'Fixture task','tests':'Fixture tests','complete':complete,
              'blocked':'' if complete else 'Fixture blocker','allow_merge':False}
    executed = False
    with tempfile.TemporaryDirectory() as folder:
        event_path = Path(folder)/'event.json';event_path.write_text(json.dumps(event))

        def gh(args, **kwargs):
            calls.append(args)
            if args[:2] == ['auth','token']: return 'fixture-credential-only'
            if args[:2] == ['api','user']: return json.dumps({'login':'frost831'})
            if args[0] == 'api':
                path = args[1]
                if '/comments?' in path:
                    row = dict(comment)
                    if changed_scope and executed: row['body'] = 'Stop: owner changed scope'
                    return json.dumps([row])
                if '/issues/125' in path: return json.dumps(issue)
                if path == 'repos/'+REPO: return json.dumps({'private':True,'default_branch':'master'})
                raise AssertionError('Unexpected fixture request')
            if args[:2] == ['pr','list']: return '[]'
            if report_failure and args[:2] == ['issue','comment'] and 'Tests:' in args[-1]:
                raise RuntimeError('Fixture reporting failure')
            return ''

        def execute(args, **kwargs):
            nonlocal executed
            if args[:2] == ['fixture-codex','exec']:
                if '--help' in args: return SimpleNamespace(stdout='--approve-for-me',returncode=0)
                prompts.append(kwargs['input']);executed=True
                Path(args[args.index('--output-last-message')+1]).write_text(json.dumps(result))
            if publication_failure and args[:2] == ['git','push']:
                raise RuntimeError('Fixture publish failure')
            output = ' M a.txt\n' if args[:3] == ['git','status','--porcelain'] else ''
            return SimpleNamespace(stdout=output,returncode=0)

        def publish(*args, **kwargs):
            if publication_failure: raise RuntimeError('Fixture publish failure')
            return 'https://example.invalid/pull/1'

        def finish(*args):
            if check_failure: raise RuntimeError('Fixture failed required CI')

        env = {'GITHUB_EVENT_PATH':str(event_path),'GITHUB_EVENT_NAME':'workflow_dispatch',
               'AGENT_MACHINE':'pc','GITHUB_RUN_ID':'1','GITHUB_RUN_ATTEMPT':'1',
               'GITHUB_WORKSPACE':folder,'RUNNER_TEMP':folder,'RUNNER_NAME':'fixture',
               'GITHUB_REPOSITORY':REPO}
        with contextlib.ExitStack() as stack:
            stack.enter_context(patch.dict(os.environ,env))
            stack.enter_context(patch.object(bridge,'gh',side_effect=gh))
            stack.enter_context(patch.object(bridge,'execute',side_effect=execute))
            stack.enter_context(patch.object(bridge.shutil,'which',return_value='fixture-codex'))
            stack.enter_context(patch.object(bridge,'finish_pr',side_effect=finish))
            for name, replacement in [('create_isolated_checkout',None),('assert_checkout_origin',None),
                                      ('cleanup_job_checkout',None),('assert_no_staged_secrets',None),('publish',publish)]:
                if hasattr(bridge,name):
                    stack.enter_context(patch.object(bridge,name,side_effect=replacement) if replacement else patch.object(bridge,name))
            stack.enter_context(contextlib.redirect_stderr(io.StringIO()))
            try: outcome = bridge.main();error = None
            except Exception as exc: outcome = None;error = exc
    return calls,prompts,outcome,error


class Hardening(unittest.TestCase):
    def assert_not_done(self,calls):
        self.assertFalse(any(call[index+1] == 'agent:done' for call in calls
                             if call[:2] == ['issue','edit']
                             for index,flag in enumerate(call[:-1]) if flag == '--add-label'))

    def test_publication_failure_is_not_done(self):
        calls,_,_,error=simulate(publication_failure=True)
        self.assertIsNotNone(error);self.assert_not_done(calls)

    def test_required_check_failure_is_not_done(self):
        calls,_,_,error=simulate(check_failure=True)
        self.assertIsNotNone(error);self.assert_not_done(calls)

    def test_report_failure_is_not_done(self):
        calls,_,_,error=simulate(report_failure=True)
        self.assertIsNotNone(error);self.assert_not_done(calls)

    def test_incomplete_task_returns_failure(self):
        calls,_,outcome,error=simulate(complete=False)
        self.assertIsNone(error);self.assertIs(outcome,False);self.assert_not_done(calls)

    def test_dispatch_receives_owner_correction(self):
        _,prompts,outcome,error=simulate()
        self.assertIsNone(error);self.assertTrue(outcome)
        self.assertIn('Latest correction: do not rebuild; PR-only',prompts[0])

    def test_owner_stop_before_publish_prevents_completion(self):
        calls,_,_,error=simulate(changed_scope=True)
        self.assertIsNotNone(error);self.assert_not_done(calls)

    def test_owner_comments_paginate_and_exclude_receipts_and_nonowners(self):
        first=[{'id':n,'user':{'login':'other'},'body':'not authority'} for n in range(100)]
        last=[{'id':101,'user':{'login':'frost831'},'body':'latest owner'},
              {'id':102,'user':{'login':'frost831'},'body':'<!-- agent-bridge:1 --> result'}]
        with patch.object(bridge,'gh',side_effect=[json.dumps(first),json.dumps(last)]) as remote:
            text=bridge.owner_followups(1,{},REPO)
        self.assertIn('latest owner',text);self.assertNotIn('not authority',text)
        self.assertNotIn('agent-bridge',text);self.assertEqual(remote.call_count,2)

    def test_owner_inventory_failure_stops(self):
        with patch.object(bridge,'gh',side_effect=RuntimeError('Fixture API failure')):
            with self.assertRaises(RuntimeError):bridge.owner_followups(1,{},REPO)

    def test_inconsistent_result_is_rejected(self):
        for invalid in [{'complete':True},
                        {'summary':'x','tests':'y','complete':True,'blocked':'still blocked','allow_merge':False},
                        {'summary':'x','tests':'y','complete':False,'blocked':'x','allow_merge':True},
                        {'summary':None,'tests':'y','complete':True,'blocked':'','allow_merge':False}]:
            with self.subTest(invalid=invalid),self.assertRaises(RuntimeError):bridge.validate_result(invalid)

    def test_credential_formats_are_rejected_and_redacted(self):
        for prefix in ['github_'+'pat_','gh'+'p_','sk-'+'proj-','sk_'+'live_']:
            fixture=prefix+'A'*50
            with self.subTest(prefix=prefix),patch.object(bridge,'execute',side_effect=[SimpleNamespace(stdout='a.txt\0'),SimpleNamespace(stdout='+value='+fixture)]):
                with self.assertRaises(RuntimeError):bridge.assert_no_staged_secrets(Path('.'),{})
            self.assertNotIn(fixture,bridge.redact(fixture))

    def test_private_credential_files_are_rejected(self):
        for name in ['.env.production','ios/signing.p12','android/release.jks','secrets.key']:
            with self.subTest(name=name),patch.object(bridge,'execute',return_value=SimpleNamespace(stdout=name+'\0')):
                with self.assertRaises(RuntimeError):bridge.assert_no_staged_secrets(Path('.'),{})

    def test_ordinary_source_is_allowed(self):
        with patch.object(bridge,'execute',side_effect=[SimpleNamespace(stdout='app.py\0'),SimpleNamespace(stdout='+value=42')]):
            bridge.assert_no_staged_secrets(Path('.'),{})

    def test_failed_or_timed_out_process_query_is_busy(self):
        with patch.object(bridge.subprocess,'run',return_value=SimpleNamespace(returncode=2,stdout='')):
            self.assertTrue(bridge.git_process_running())
        with patch.object(bridge.subprocess,'run',side_effect=subprocess.TimeoutExpired('fixture',20)):
            self.assertTrue(bridge.git_process_running())

    def test_outbound_credential_is_redacted(self):
        fixture='github_'+'pat_'+'A'*50
        with patch.object(bridge,'execute',return_value=SimpleNamespace(stdout='')) as command:
            bridge.gh(['issue','comment','1','--body','value '+fixture],env={})
        self.assertNotIn(fixture,command.call_args.args[0][-1])


if __name__=='__main__':unittest.main()
