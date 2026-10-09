// Content Forge on the stage: holographic panels orbiting the arc reactor, each lighting up as its
// part of the run happens. Data comes from the package on the Forge right now.
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, Flame, Hash, ImageIcon, ScrollText, ShieldAlert, ShieldCheck, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { getForgePackage } from '../../jarvis/brain/forge';
import { ArcReactor } from '../../jarvis/ui/ArcReactor';
import { useAppState } from '../../state/AppProvider';
import { currentWorkflow } from '../../state/selectors';

const STAGE_LABEL: Record<string, string> = {
  understand: 'Reading the trend',
  decide: 'Choosing the angle',
  execute: 'Building the package',
  verify: 'Checking before posting',
};

function Holo({ icon, title, on, children, className = '' }: { icon: ReactNode; title: string; on: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`forge__holo ${on ? 'is-on' : ''} ${className}`}>
      <div className="forge__holo-head mono-sm">
        {icon} {title}
      </div>
      <div className="forge__holo-body">{children}</div>
    </div>
  );
}

export function ForgeStage() {
  const state = useAppState();
  const { run } = state;
  const wf = currentWorkflow(state);
  const pkg = getForgePackage();
  if (!pkg) return null;

  const lane = (id: string) => Math.max(0, run.lanes[id] ?? -1);
  const laneOf = (id: string) => wf.lanes.find((l) => l.id === id)!;
  const progress = (id: string) => lane(id) / laneOf(id).steps.length;
  const check = run.checks['c-forge'];
  const fixed = run.corrected;
  const shownTrend = Math.min(pkg.trend.length, Math.max(0, run.facts));

  return (
    <div className="forge">
      <div className="forge__col">
        <Holo icon={<Flame size={11} />} title="Why now" on={run.facts > 0}>
          {pkg.trend.slice(0, 3).map((t, i) => (
            <div key={t.label} className={`forge__trend ${i < shownTrend ? 'is-on' : ''}`}>
              <span className="forge__trend-label">{t.label}</span>
              <span className="forge__bar">
                <motion.i initial={{ width: 0 }} animate={{ width: i < shownTrend ? `${t.score}%` : 0 }} transition={{ duration: 0.8 }} />
              </span>
              <span className="mono-sm">{i < shownTrend ? t.score : '··'}</span>
            </div>
          ))}
        </Holo>
        <Holo icon={<Target size={11} />} title="Angle & format" on={run.plan > 0}>
          <p className="forge__angle">{run.plan > 0 ? pkg.angle : 'Waiting for the trend read…'}</p>
          {run.plan > 1 && <div className="forge__chip mono-sm">{wf.plan[1].detail}</div>}
        </Holo>
      </div>

      <div className="forge__core">
        <div className="forge__orbit" />
        <ArcReactor size={8.5} />
        <div className="forge__topic">{pkg.topic}</div>
        <div className="forge__stage mono-sm">{STAGE_LABEL[run.stage ?? ''] ?? 'Accepting the brief'}</div>
        <AnimatePresence>
          {check && check !== 'pending' && check !== 'checking' && (
            <motion.div
              key="issue"
              className={`forge__issue ${fixed ? 'is-fixed' : ''}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mono-sm forge__issue-head">
                {fixed ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />} {pkg.issue.field}
              </div>
              <div className="forge__issue-line">
                <s>{pkg.issue.generated}</s>
                {fixed && <b> → {pkg.issue.verified}</b>}
              </div>
              {!fixed && <div className="forge__issue-why">{pkg.issue.reason}</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="forge__col">
        <Holo icon={<ImageIcon size={11} />} title="Thumbnails" on={lane('thumbs') > 0}>
          <div className="forge__thumbs">
            {pkg.thumbnails.map((th, i) => (
              <div key={th.title} className={`forge__thumb forge__thumb--${i} ${progress('thumbs') * 3 > i ? 'is-on' : ''}`} title={th.visual}>
                <span>{th.title}</span>
              </div>
            ))}
          </div>
        </Holo>
        <Holo icon={<Hash size={11} />} title="Captions EN / AR" on={lane('captions') > 0}>
          <p className="forge__cap">{lane('captions') > 0 ? pkg.captions.en : '—'}</p>
          <p className="forge__cap forge__cap--ar" dir="rtl">
            {lane('captions') > 1 ? pkg.captions.ar : '—'}
          </p>
          {lane('captions') > 2 && <div className="forge__tags mono-sm">{pkg.hashtags.join(' ')}</div>}
        </Holo>
      </div>

      <div className="forge__strip">
        <Holo icon={<ScrollText size={11} />} title="Hook & script" on={lane('script') > 0} className="forge__script">
          <p className="forge__hook">{lane('script') > 0 ? `“${pkg.hook}”` : 'Script starts at EXECUTE'}</p>
          <div className="forge__beats">
            {pkg.script.map((_, i) => (
              <span key={i} className={progress('script') * pkg.script.length > i ? 'is-on' : ''}>
                {i + 1}
              </span>
            ))}
          </div>
        </Holo>
        <Holo icon={<Clapperboard size={11} />} title="Shots & post" on={lane('shots') > 0}>
          <div className="forge__meta">
            <span>
              <b>{lane('shots') > 0 ? pkg.shots.length : '·'}</b> shots
            </span>
            <span>
              <b>{lane('post') > 0 ? pkg.postTime : '·'}</b>
            </span>
          </div>
        </Holo>
      </div>
    </div>
  );
}
