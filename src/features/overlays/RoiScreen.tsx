import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock3, Users, X } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '../../components/primitives';
import { client, impactBaseline, os, roi } from '../../data/client';
import { prospect } from '../../data/prospect';
import { signals } from '../../data/signals';
import { workflowForSignal } from '../../data/workflows';
import { CountUp } from '../../motion/CountUp';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';

const WEEKS_PER_MONTH = 4.33;

const splitTotal = signals.reduce((a, s) => a + workflowForSignal(s.id).impact.hours, 0);
const split = signals.map((s) => ({
  id: s.id,
  label: s.kind,
  share: workflowForSignal(s.id).impact.hours / splitTotal,
}));

const INR_PER_USD = 83;

const fmtRupees = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)}L`);

const fmtMoney = (rupees: number) => {
  if (prospect.preset !== 'agency') return fmtRupees(rupees);
  const usd = rupees / INR_PER_USD;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 10_000) return `$${Math.round(usd / 1000)}K`;
  return `$${Math.round(usd).toLocaleString('en-US')}`;
};

function RoiInner() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [team, setTeam] = useState(roi.teamSize);

  const hours = team * roi.hoursPerPersonWeek * roi.automationShare * WEEKS_PER_MONTH;
  const cost = hours * roi.hourlyCost;
  const fte = hours / 160;
  const handledCount = signals.filter((s) => state.handled[s.id]).length;
  const demoHours = state.impact.hoursSaved - impactBaseline.hoursSaved;

  return (
    <motion.div className="roi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.base}>
      <div className="roi__backdrop" />
      <motion.div className="roi__frame" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={t.slow}>
        <button className="roi__close" onClick={() => dispatch({ type: 'OVERLAY', overlay: null })} aria-label="Close">
          <X size={16} />
        </button>

        <div className="roi__main">
          <div className="mono-sm t-acc">Projected impact · monthly</div>
          <h2 className="display roi__title">
            What this means for <em>{client.name}</em>
          </h2>

          <div className="roi__team">
            <div className="roi__team-head">
              <span className="roi__team-label">
                <Users size={13} className="t-3" /> {roi.teamLabel}
              </span>
              <span className="display roi__team-n">{team}</span>
            </div>
            <input
              type="range"
              min={roi.teamMin}
              max={roi.teamMax}
              value={team}
              onChange={(e) => setTeam(Number(e.target.value))}
              className="roi__slider"
              style={{ ['--p' as string]: `${((team - roi.teamMin) / (roi.teamMax - roi.teamMin)) * 100}%` }}
              aria-label="Team size"
            />
          </div>

          <div className="roi__metrics">
            <div className="roi__metric">
              <span className="mono-sm t-3">Hours returned</span>
              <span className="display roi__big">
                <CountUp value={hours} duration={0.8} format={(n) => Math.round(n).toLocaleString('en-IN')} />
                <small>h / month</small>
              </span>
              <span className="roi__sub">≈ {fte.toFixed(1)} full-time people freed for client work</span>
            </div>
            <div className="roi__metric">
              <span className="mono-sm t-3">Cost equivalent</span>
              <span className="display roi__big">
                <CountUp value={cost} duration={0.8} format={fmtMoney} />
                <small>/ month</small>
              </span>
              <span className="roi__sub">
                At {prospect.preset === 'agency' ? `$${Math.round(roi.hourlyCost / INR_PER_USD)}` : `₹${roi.hourlyCost.toLocaleString('en-IN')}`} per loaded hour
              </span>
            </div>
            <div className="roi__metric">
              <span className="mono-sm t-3">Response time</span>
              <span className="display roi__big roi__resp">
                <s>{roi.responseBefore}</s>
                <ArrowRight size={18} className="t-4" />
                <span className="t-acc">{roi.responseAfter}</span>
              </span>
              <span className="roi__sub">
                {roi.sameDayLabel}: {roi.sameDayBefore}% → {roi.sameDayAfter}%
              </span>
            </div>
          </div>

          <div className="roi__split">
            <span className="mono-sm t-3">Where the hours come from</span>
            {split.map((row) => (
              <div key={row.id} className="roi__split-row">
                <span className="roi__split-label">{row.label}</span>
                <span className="roi__split-bar">
                  <motion.span initial={{ width: 0 }} animate={{ width: `${row.share * 100}%` }} transition={{ ...t.slow, delay: 0.2 }} />
                </span>
                <span className="roi__split-value mono-sm">≈ {Math.round(hours * row.share).toLocaleString('en-IN')} h</span>
              </div>
            ))}
          </div>

          <div className="roi__proof mono-sm">
            <Clock3 size={12} />
            {handledCount > 0
              ? `Seen in this session: ${handledCount} signal${handledCount === 1 ? '' : 's'} handled end to end, ${demoHours.toFixed(1)} hours returned.`
              : `Assumes ${roi.hoursPerPersonWeek}h of repeatable work per person per week, ${Math.round(roi.automationShare * 100)}% handled by Bombay OS.`}
          </div>
        </div>

        <aside className="roi__cta">
          <div className="roi__brand">
            <BrandMark />
            <span className="mono-sm">{os.maker}</span>
          </div>
          <div className="display roi__cta-title">Start with one workflow. See it working in a week.</div>
          <p className="roi__cta-text">{roi.pilot}</p>
          <ul className="roi__steps">
            <li><span className="mono-sm">01</span> Connect Gmail, Drive and Notion</li>
            <li><span className="mono-sm">02</span> Pick the workflow that costs you most</li>
            <li><span className="mono-sm">03</span> Run it on Suggest, move to Autopilot when ready</li>
          </ul>
          <button className="btn btn--primary btn--lg roi__btn" onClick={() => dispatch({ type: 'OVERLAY', overlay: null })}>
            Book the pilot <ArrowRight size={14} />
          </button>
          <div className="roi__sign">
            <span className="t-1">{os.presenter}</span>
            <span className="mono-sm t-3">{os.presenterRole}</span>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}

export function RoiScreen() {
  const { ui } = useAppState();
  return <AnimatePresence>{ui.overlay === 'roi' && <RoiInner key="roi" />}</AnimatePresence>;
}
