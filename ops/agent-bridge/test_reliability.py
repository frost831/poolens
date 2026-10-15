"""Regression tests use local disposable Git repositories and mocked providers."""
import hashlib
import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('bridge',Path(__file__).with_name('run.py'))
bridge=importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class Reliability(unittest.TestCase):
    def test_independent_clone_preserves_dirty_checkout_and_retained_worktree(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);origin=root/'origin.git';source=root/'runner';retained=root/'retained';fresh=root/'fresh'
            env=os.environ.copy();env['GIT_CONFIG_GLOBAL']=str(root/'empty-global');env['GIT_CONFIG_NOSYSTEM']='1'
            def git(*args,cwd=None):
                return subprocess.run(['git',*map(str,args)],cwd=cwd,env=env,check=True,capture_output=True,text=True).stdout.strip()
            git('init','--bare',origin);git('init','-b','main',source)
            git('config','user.name','Fixture',cwd=source);git('config','user.email','fixture@example.invalid',cwd=source)
            (source/'work.txt').write_text('committed\n');git('add','work.txt',cwd=source);git('commit','-m','fixture',cwd=source)
            git('remote','add','origin',origin,cwd=source);git('push','origin','main',cwd=source)
            git('worktree','add','-b','retained',retained,'main',cwd=source)
            (source/'work.txt').write_text('unsaved source work\n');(retained/'work.txt').write_text('unsaved retained work\n')
            before=(source/'.git/config').read_bytes();tree_before=git('worktree','list','--porcelain',cwd=source)
            expected=git('rev-parse','main',cwd=source)
            bridge.create_isolated_checkout(source,fresh,'main','agent/fixture',env,remote=str(origin),expected_sha=expected)
            self.assertEqual(git('rev-parse','HEAD',cwd=fresh),expected)
            self.assertEqual(git('branch','--show-current',cwd=fresh),'agent/fixture')
            self.assertTrue((fresh/'.git').is_dir())
            self.assertEqual((source/'.git/config').read_bytes(),before)
            self.assertEqual(git('worktree','list','--porcelain',cwd=source),tree_before)
            self.assertEqual((source/'work.txt').read_text(),'unsaved source work\n')
            self.assertEqual((retained/'work.txt').read_text(),'unsaved retained work\n')
            (fresh/'work.txt').write_text('agent change\n')
            self.assertEqual((retained/'work.txt').read_text(),'unsaved retained work\n')

    def test_changed_remote_head_prevents_pickup(self):
        def execute(args,**kwargs):return SimpleNamespace(stdout='different-sha\n')
        with patch.object(bridge,'execute',side_effect=execute), self.assertRaisesRegex(RuntimeError,'changed during pickup'):
            bridge.create_isolated_checkout(Path('source'),Path('new'),'main','agent/new',{},expected_sha='approved-sha')

    def test_each_repository_requires_its_actual_primary_suites(self):
        for repo,names in bridge.REQUIRED_CHECKS.items():
            with self.subTest(repo=repo),patch.object(bridge,'REPO',repo):
                passed=[{'name':name,'bucket':'pass'} for name in names]
                self.assertTrue(bridge.checks_passed(passed))
                self.assertFalse(bridge.checks_passed([]))
                self.assertFalse(bridge.checks_passed([{'name':'unrelated','bucket':'pass'}]))
                self.assertFalse(bridge.checks_passed([{'name':name,'bucket':'skipping'} for name in names]))
                self.assertFalse(bridge.checks_passed(passed+[{'name':'additional-security','bucket':'pending'}]))
                self.assertFalse(bridge.checks_passed(passed+[{'name':'additional-security','bucket':'fail'}]))

    def test_unknown_repository_is_not_mergeable(self):
        with patch.object(bridge,'REPO','someone/else'):
            self.assertFalse(bridge.checks_passed([{'name':'verify','bucket':'pass'}]))

    def test_failure_classification_does_not_expose_private_output(self):
        result=SimpleNamespace(returncode=1,stdout='private stdout',stderr='HTTP 403 private-token-value private body')
        with patch.object(bridge.subprocess,'run',return_value=result), self.assertRaisesRegex(RuntimeError,'access_denied') as error:
            bridge.execute(['gh','api','private'])
        self.assertNotIn('private-token-value',str(error.exception))
        self.assertNotIn('private body',str(error.exception))

    def test_nonowner_task_is_rejected(self):
        event={'sender':{'login':'someone-else'},'repository':{'full_name':bridge.REPO,'private':True},'action':'opened'}
        issue={'number':1,'title':'Task','body':'Text','state':'open','user':{'login':'frost831'},'labels':[{'name':'agent:pc'}]}
        self.assertFalse(bridge.authorized_event(event,'issues','pc',issue))

    def test_pr_only_result_never_merges(self):
        with patch.object(bridge,'gh') as remote,patch.object(bridge,'execute') as command:
            bridge.finish_pr('pr-url',{'complete':True,'allow_merge':False},None,Path('.'),{})
            remote.assert_not_called();command.assert_not_called()

if __name__=='__main__':unittest.main()
