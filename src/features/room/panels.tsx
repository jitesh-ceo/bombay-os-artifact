import { Check, ExternalLink, Flame, Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { Pill } from '../../components/primitives';
import { prospect } from '../../data/prospect';
import { consistencyPct } from './metrics';
import { ACCOUNTS, BUFFER, GATE, INBOX, NOTES, PACK } from './seed';
import { useRoom } from './store';
import { compact, dubaiDate, fmtMin, fmtStamp, minutesNow, runsToday } from './time';
import type { Channel, Competitor, NewsLane, OutreachStatus } from './types';
import { ago, M, Panel, Spark } from './ui';

/* ───────── Live wall ───────── */

function WallRow({ ch, masked }: { ch: Channel; masked: boolean }) {
  const room = useRoom();
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState('');
  const manual = ch.source === 'manual';
  const followers = ch.id === 'li-profile' ? room.settings.liProfileFollowers : ch.id === 'tiktok' ? room.settings.tiktokFollowers : ch.followers;
  const at = ch.id === 'li-profile' ? room.settings.liProfileAt : room.settings.tiktokAt;
  const weak = !manual && (ch.er ?? 9) < 2.5;

  return (
    <tr className={weak ? 'is-weak' : ''}>
      <td>
        <span className="rm-handle">
          <b>{ch.handle}</b>
          <Pill tone={ch.owner === 'studio' ? 'accent' : 'neutral'}>{ch.owner === 'studio' ? room.t('studio') : room.t('clientTag')}</Pill>
        </span>
      </td>
      <td className="rm-platform">{ch.platform}</td>
      <td className="rm-num rm-num--strong">
        <M on={masked} w={5}>
          {compact(followers)}
        </M>
      </td>
      {manual ? (
        <td colSpan={6} className="rm-manual-cell">
          {edit ? (
            <form
              className="rm-inline-form"
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(val.replace(/[^\d]/g, ''));
                if (n) room.updateManual(ch.id === 'tiktok' ? 'tiktok' : 'li', n);
                setEdit(false);
              }}
            >
              <input value={val} onChange={(e) => setVal(e.target.value)} inputMode="numeric" autoFocus aria-label={room.t('followers')} />
              <button className="btn btn--primary btn--sm" type="submit">
                {room.t('save')}
              </button>
              <button className="btn btn--ghost btn--sm" type="button" onClick={() => setEdit(false)}>
                {room.t('cancel')}
              </button>
            </form>
          ) : (
            <button
              className="rm-manual"
              disabled={masked}
              onClick={() => {
                setVal(String(followers));
                setEdit(true);
              }}
            >
              <Pill tone="dim">{room.t('manual')}</Pill>
              <span>
                {at} · {room.t('tapUpdate')}
              </span>
              <span className="t-3">· {room.t('noApi')}</span>
            </button>
          )}
        </td>
      ) : (
        <>
          <td className="rm-num">
            <M on={masked}>{compact(ch.reach14 ?? 0)}</M>
          </td>
          <td className={`rm-num ${weak ? 't-bad' : ''}`}>
            <M on={masked} w={3}>
              {ch.er}%
            </M>
          </td>
          <td className="rm-num">
            <M on={masked} w={3}>
              +{compact(ch.newFollowers ?? 0)}
            </M>
          </td>
          <td className="rm-num t-ok">
            <M on={masked} w={3}>
              +{ch.growth}%
            </M>
          </td>
          <td className="rm-trend">{masked ? <span className="rm-mask">▮▮▮▮▮▮</span> : <Spark data={ch.dailyReach ?? []} w={120} h={24} />}</td>
          <td className="rm-num">
            <M on={masked} w={3}>
              {consistencyPct(ch.dailyReach)}%
            </M>
          </td>
        </>
      )}
    </tr>
  );
}

export function LiveWall() {
  const room = useRoom();
  const masked = room.panelMasked('wall') === 'numbers';
  return (
    <Panel
      id="wall"
      title={room.t('pWall')}
      source="Meta Ads · LinkedIn · manual snapshots"
      fresh={`${room.t('cached')} · ${ago(room.refreshedAt, room.lang)}`}
      connector={['metaads', 'linkedin']}
    >
      <table className="rm-table rm-wall">
        <thead>
          <tr>
            <th>{room.t('channel')}</th>
            <th>{room.t('platform')}</th>
            <th>{room.t('followers')}</th>
            <th>{room.t('reach14')}</th>
            <th>{room.t('er')}</th>
            <th>{room.t('newFollowers')}</th>
            <th>{room.t('growth')}</th>
            <th>{room.t('trend')}</th>
            <th>{room.t('consistency')}</th>
          </tr>
        </thead>
        <tbody>
          {room.channels.map((ch) => (
            <WallRow key={ch.id} ch={ch} masked={masked} />
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

/* ───────── Today ───────── */

export function Today() {
  const room = useRoom();
  const ar = room.lang === 'ar';
  const now = minutesNow();
  const current = room.inProgress;
  const next = room.calendar.filter((e) => e.start > now)[0];
  const fresh = INBOX.filter((m) => m.ageH <= 48);
  return (
    <Panel id="today" title={room.t('pToday')} source="Calendar · Gmail · Notion" fresh={ago(room.refreshedAt, room.lang)} connector={['calendar', 'gmail', 'notion']}>
      <div className="rm-today">
        <div className="rm-now">
          <Pill tone="accent" dot>
            {room.t('now')}
          </Pill>
          {current ? (
            <div>
              <div className="rm-strong">{ar ? current.titleAr : current.title}</div>
              <div className="mono-sm t-4">
                {fmtMin(current.start)}–{fmtMin(current.end)} · {current.with}
              </div>
              <div className="rm-progress">
                <i style={{ width: `${((now - current.start) / (current.end - current.start)) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="t-3">{room.t('nothingNow')}</div>
          )}
        </div>
        {next && (
          <div className="rm-now">
            <Pill tone="dim">{room.t('next')}</Pill>
            <div>
              <div className="rm-strong">{ar ? next.titleAr : next.title}</div>
              <div className="mono-sm t-4">
                {fmtMin(next.start)} · {next.with}
              </div>
            </div>
          </div>
        )}
        <div className="rm-sub">
          <span>{room.t('inbox')}</span>
          <span className="t-4">
            {fresh.length} {room.t('unread2d')}
          </span>
        </div>
        <ul className="rm-list">
          {fresh.map((m) => (
            <li key={m.id}>
              <span className="rm-dot" />
              <span className="rm-ellipsis">
                <b>{m.from}</b> · {ar ? m.subjectAr : m.subject}
              </span>
              <span className="mono-sm t-4">{m.ageH}h</span>
            </li>
          ))}
        </ul>
        <div className="rm-sub">
          <span>{room.t('notes')}</span>
          <span className="t-4">{NOTES[0].when}</span>
        </div>
        <div className="rm-note">
          <b>{NOTES[0].title}</b>
          {(ar ? NOTES[0].pointsAr : NOTES[0].points).map((p) => (
            <span key={p}>· {p}</span>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ───────── Command list ───────── */

export function CommandList() {
  const room = useRoom();
  const ar = room.lang === 'ar';
  const [tab, setTab] = useState<'tasks' | 'routines'>('tasks');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(dubaiDate());
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const today = dubaiDate();
  const todays = room.routines.filter((r) => runsToday(r.days));
  const openCount = room.tasks.filter((x) => !x.done).length;
  const dueLabel = (d: string | null) => (!d ? room.t('noDue') : d === today ? room.t('today') : d === dubaiDate(1) ? room.t('tomorrow') : d.slice(5));

  return (
    <Panel
      id="cmd"
      title={room.t('pCmd')}
      source="Room database · tasks · routines"
      fresh={room.t('editHint')}
      right={
        <div className="rm-tabs">
          <button className={tab === 'tasks' ? 'is-on' : ''} onClick={() => setTab('tasks')}>
            {room.t('tasks')} · {openCount}
          </button>
          <button className={tab === 'routines' ? 'is-on' : ''} onClick={() => setTab('routines')}>
            {room.t('routines')} · {todays.filter((r) => r.lastDone === today).length}/{todays.length}
          </button>
        </div>
      }
    >
      {tab === 'tasks' ? (
        <div className="rm-cmd">
          <form
            className="rm-add"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              room.addTask(title.trim(), due || null, account);
              setTitle('');
            }}
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={room.t('addTask')} dir="auto" />
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label={room.t('due')} />
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              {ACCOUNTS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <button className="btn btn--primary btn--sm rm-add__go" type="submit" aria-label={room.t('add')}>
              <Plus size={12} />
            </button>
          </form>
          <ul className="rm-tasks">
            {[...room.tasks]
              .sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9').localeCompare(b.due ?? '9'))
              .map((task) => (
                <li key={task.id} className={`${task.done ? 'is-done' : ''} ${task.priority === 'high' ? 'is-high' : ''}`}>
                  <button className="rm-check" onClick={() => room.toggleTask(task.id)} aria-label="tick">
                    {task.done && <Check size={10} strokeWidth={3} />}
                  </button>
                  {editing === task.id ? (
                    <form
                      className="rm-task__edit"
                      onSubmit={(e) => {
                        e.preventDefault();
                        room.editTask(task.id, { title: editVal });
                        setEditing(null);
                      }}
                    >
                      <input value={editVal} onChange={(e) => setEditVal(e.target.value)} autoFocus onBlur={() => setEditing(null)} />
                    </form>
                  ) : (
                    <span
                      className="rm-task__title"
                      onDoubleClick={() => {
                        setEditing(task.id);
                        setEditVal(task.title);
                      }}
                      dir="auto"
                    >
                      {task.title}
                    </span>
                  )}
                  <span className={`mono-sm ${task.due && task.due < today && !task.done ? 't-bad' : 't-4'}`}>{dueLabel(task.due)}</span>
                  <span className="rm-account">{task.account}</span>
                  <button className="rm-icon" onClick={() => room.deleteTask(task.id)} aria-label={room.t('delete')}>
                    <Trash2 size={11} />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <ul className="rm-routines">
          {todays.map((r) => {
            const done = r.lastDone === today;
            return (
              <li key={r.id} className={done ? 'is-done' : ''}>
                <button className="rm-check" onClick={() => room.tickRoutine(r.id)} aria-label="tick">
                  {done && <Check size={10} strokeWidth={3} />}
                </button>
                <span className="mono-sm t-4">{r.time}</span>
                <span className="rm-task__title">
                  <b className="t-4">{r.id}</b> {ar ? r.titleAr : r.title}
                </span>
                <span className="rm-streak">
                  <Flame size={10} /> {r.streak}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/* ───────── Publishing ───────── */

export function Publishing() {
  const room = useRoom();
  const masked = room.panelMasked('buffer') === 'numbers';
  const max = Math.max(...BUFFER.daily);
  return (
    <Panel id="buffer" title={room.t('pBuffer')} source="Buffer · studio and client channels" fresh={`${room.t('cached')} · ${ago(room.refreshedAt, room.lang)}`} connector="buffer">
      <div className="rm-publishing">
        <div className="rm-kpis">
          {(
            [
              ['posts', BUFFER.posts.toString()],
              ['reactions', compact(BUFFER.reactions)],
              ['comments', compact(BUFFER.comments)],
              ['erRate', `${BUFFER.er}%`],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <span className="rm-kpi">
                <M on={masked} w={4}>
                  {v}
                </M>
              </span>
              <span className="rm-label">{room.t(k)}</span>
            </div>
          ))}
        </div>
        <div className="rm-chart">
          <span className="rm-sub">{room.t('postsPerDay')}</span>
          <div className="rm-bars">
            {BUFFER.daily.map((v, i) => (
              <i key={i} style={{ height: masked ? '12%' : `${(v / max) * 100}%` }} className={masked ? 'is-masked' : ''} />
            ))}
          </div>
        </div>
        <div>
          <span className="rm-sub">{room.t('byChannel')}</span>
          <ul className="rm-list">
            {BUFFER.channels.map((c) => (
              <li key={c.name}>
                <span className="rm-ellipsis">{c.name}</span>
                <span className="rm-num">
                  <M on={masked} w={2}>
                    {c.posts}
                  </M>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

/* ───────── Newswire ───────── */

const LANES: { id: 'all' | NewsLane; key: 'laneAll' | 'laneUae' | 'laneGcc' | 'laneWorld' }[] = [
  { id: 'all', key: 'laneAll' },
  { id: 'uae', key: 'laneUae' },
  { id: 'gcc', key: 'laneGcc' },
  { id: 'world', key: 'laneWorld' },
];

export function Newswire() {
  const room = useRoom();
  const ar = room.lang === 'ar';
  const [lane, setLane] = useState<'all' | NewsLane>('all');
  const list = room.stories.filter((s) => s.ageH <= 48 && (lane === 'all' || s.lane === lane));
  const breaking = room.breaking[0];
  return (
    <Panel
      id="news"
      title={room.t('pNews')}
      source="Firecrawl · UAE → GCC → world"
      fresh={room.sweeping ? room.t('sweeping') : `${room.t('sweptAt')} ${ago(room.sweptAt, room.lang)} · ${room.t('every6h')}`}
      connector="firecrawl"
    >
      <div className="rm-news">
        {breaking && (
          <button className="rm-breaking" onClick={() => room.setOverlay({ kind: 'story', id: breaking.id })}>
            <Zap size={12} />
            <span className="mono-sm">{room.t('breaking')}</span>
            <span className="rm-ellipsis">{ar ? breaking.headlineAr : breaking.headline}</span>
          </button>
        )}
        <div className="rm-lanes">
          {LANES.map((l) => (
            <button key={l.id} className={lane === l.id ? 'is-on' : ''} onClick={() => setLane(l.id)}>
              {room.t(l.key)}
            </button>
          ))}
        </div>
        <ul className={`rm-stories ${room.sweeping ? 'is-sweeping' : ''}`}>
          {list.map((s) => (
            <li key={s.id}>
              <button onClick={() => room.setOverlay({ kind: 'story', id: s.id })}>
                <span className="rm-story__meta">
                  <span className={`rm-outlet ${s.approved ? 'is-approved' : ''}`}>{s.outlet}</span>
                  <span className="mono-sm t-4">{s.approved ? room.t('approved') : room.t('context')}</span>
                  {s.ageH <= 1 && <Pill tone="accent">{room.t('isNew')}</Pill>}
                </span>
                <span className="rm-story__head" dir="auto">
                  {ar ? s.headlineAr : s.headline}
                </span>
                <span className="rm-scores mono-sm">
                  <span>
                    <b>{s.ageH}h</b> {room.t('fresh')}
                  </span>
                  <span>
                    {room.t('virality')} <b>{s.virality}</b>
                  </span>
                  <span>
                    {room.t('forClient')} <b>{s.client}</b>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mono-sm t-4">
          {GATE.dropped} {room.t('gate')} · {GATE.blocked} {room.t('blocked')} · {GATE.blockedOutlet}
        </div>
      </div>
    </Panel>
  );
}

/* ───────── New business agent ───────── */

const STAGES: { id: OutreachStatus; key: 'fShortlist' | 'fInvited' | 'fDm' | 'fReplied' | 'fBooked'; stat: 'shortlist' | 'invitesSent' | 'dm' | 'replied' | 'booked' }[] = [
  { id: 'shortlist', key: 'fShortlist', stat: 'shortlist' },
  { id: 'invited', key: 'fInvited', stat: 'invitesSent' },
  { id: 'dm', key: 'fDm', stat: 'dm' },
  { id: 'replied', key: 'fReplied', stat: 'replied' },
  { id: 'booked', key: 'fBooked', stat: 'booked' },
];

export function PipelineAgent() {
  const room = useRoom();
  const max = room.pipeline.shortlist;
  return (
    <Panel id="pipeline" title={room.t('pPipeline')} source="Room database · pipeline · pack · outreach" fresh={`${PACK.week} · ${PACK.dates}`} connector="linkedin">
      <div className="rm-funnel">
        {STAGES.map((st) => {
          const v = room.pipeline[st.stat];
          return (
            <div key={st.id}>
              <span className="rm-funnel__bar">
                <i style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
              </span>
              <b className="rm-num">{v}</b>
              <span className="mono-sm t-4">{room.t(st.key)}</span>
            </div>
          );
        })}
      </div>
      <div className="rm-sub">
        <span>
          {room.t('pack')} · {PACK.week} · {PACK.theme}
        </span>
        <span className="t-bad">
          {PACK.decisionsOpen} {room.t('decisions')}
        </span>
      </div>
      <div className="rm-pack">
        {PACK.slots.map((s) => (
          <span key={s.day + s.pillar} className={`rm-slot is-${s.status}`}>
            <b>{s.day}</b> {s.lang} · {s.pillar} <em>{s.status}</em>
          </span>
        ))}
      </div>
      <div className="mono-sm t-4 rm-ellipsis">
        {room.t('offer')}: <span className="t-2">{PACK.offer}</span>
      </div>
      <div className="rm-sub">
        <span>{room.t('outreach')}</span>
        <span className="t-4">
          {room.t('dmLog')} · {room.dmlog.length}
        </span>
      </div>
      <ul className="rm-outreach">
        {room.outreach.map((p) => (
          <li key={p.n}>
            <button onClick={() => room.setOverlay({ kind: 'dm', n: p.n })}>
              <span className="rm-avatar">{p.n.slice(0, 1)}</span>
              <span className="rm-ellipsis">
                <b>{p.n}</b> · {p.r}, {p.c}
              </span>
              <span className={`rm-status is-${p.s}`}>{p.s}</span>
            </button>
          </li>
        ))}
      </ul>
      {room.dmlog[0] && (
        <div className="mono-sm t-4 rm-ellipsis">
          {room.t('stamped')} · {room.dmlog[0].name} → {room.dmlog[0].status} · {fmtStamp(room.dmlog[0].at, room.lang)}
        </div>
      )}
    </Panel>
  );
}

/* ───────── Rival agencies ───────── */

export function Rivals() {
  const room = useRoom();
  const [lane, setLane] = useState<Competitor['lane']>('performance');
  const namesMasked = room.panelMasked('rivals') === 'names';
  const numbersMasked = room.masks.numbers;
  const ours = (c: Competitor) => (c.platform === 'LinkedIn' ? room.channels[1].followers : room.channels[0].followers);
  const list = room.competitors.filter((c) => c.lane === lane).sort((a, b) => b.followers - a.followers);
  const top = [...list].sort((a, b) => b.published.views - a.published.views)[0];
  const laneMax = Math.max(1, ...list.map((c) => Math.max(c.followers, ours(c))));

  return (
    <Panel
      id="rivals"
      title={room.t('pRivals')}
      source="Room database · rivals · Firecrawl sweep"
      fresh={`${list[0]?.asOf ?? ''} · ${room.t('every6h')}`}
      connector="firecrawl"
      right={
        <div className="rm-tabs">
          {(
            [
              ['performance', 'laneRivalPerf'],
              ['creative', 'laneRivalCreative'],
              ['b2b', 'laneRivalB2b'],
            ] as const
          ).map(([id, k]) => (
            <button key={id} className={lane === id ? 'is-on' : ''} onClick={() => setLane(id)}>
              {room.t(k)}
            </button>
          ))}
        </div>
      }
    >
      <div className="rm-board" role="table" aria-label={room.t('pRivals')}>
        <div className="rm-board__head" role="row">
          <span role="columnheader">{room.t('agency')}</span>
          <span role="columnheader">{room.t('followers')}</span>
          <span role="columnheader">{room.t('engShort')}</span>
          <span role="columnheader">{room.t('gap')}</span>
        </div>
        {list.map((c) => {
          const us = ours(c);
          const gap = c.followers - us;
          const name = namesMasked ? '—' : c.name;
          const n = compact(Math.abs(gap));
          return (
            <div key={c.id} className="rm-board__row" role="row">
              <span className="rm-board__who" role="cell">
                <span className="rm-avatar">{namesMasked ? '·' : c.name[0]}</span>
                <span className="rm-board__id">
                  <b className="rm-ellipsis">
                    <M on={namesMasked} w={8}>
                      {c.name}
                    </M>
                  </b>
                  <span className="rm-ellipsis">
                    <M on={namesMasked} w={6}>
                      {c.handle}
                    </M>{' '}
                    · {c.platform}
                  </span>
                </span>
              </span>
              <span className="rm-num rm-num--strong" role="cell">
                <M on={numbersMasked}>{compact(c.followers)}</M>
              </span>
              <span className={`rm-num ${c.eng < 2.5 ? 't-bad' : ''}`} role="cell">
                <M on={numbersMasked} w={3}>
                  {c.eng}%
                </M>
              </span>
              <span role="cell">
                <span
                  className={`rm-gap ${gap > 0 ? 'is-ahead' : 'is-behind'}`}
                  title={numbersMasked ? undefined : room.t(gap > 0 ? 'gapAhead' : 'gapBehind', { name, n })}
                >
                  <M on={numbersMasked}>
                    {gap > 0 ? '+' : '−'}
                    {n}
                  </M>
                </span>
              </span>
              <span className="rm-board__bar" aria-hidden>
                <i style={{ width: `${(c.followers / laneMax) * 100}%` }} />
                <em style={{ insetInlineStart: `${(us / laneMax) * 100}%` }} data-label={room.t('you')} />
              </span>
            </div>
          );
        })}
      </div>
      <p className="rm-board__note">
        <span className="rm-board__you-key" />
        {room.t('gapNote', { studio: prospect.name })} ·{' '}
        <M on={numbersMasked}>Instagram {compact(room.channels[0].followers)}</M> ·{' '}
        <M on={numbersMasked}>LinkedIn {compact(room.channels[1].followers)}</M>
      </p>
      {top && (
        <div className="rm-published">
          <span className="rm-label">{room.t('publishedWeek')}</span>
          <ul>
            {[...list]
              .sort((a, b) => b.published.views - a.published.views)
              .map((c) => (
                <li key={c.id}>
                  <a href={c.url} target="_blank" rel="noreferrer" className={c.id === top.id ? 'is-top' : ''} title={room.t('openSource')}>
                    <span className="rm-published__format">{c.published.format.split(' · ')[0]}</span>
                    <span className="rm-published__body">
                      <span className="rm-ellipsis">“{c.published.hook}”</span>
                      <span className="rm-ellipsis rm-published__by">
                        <M on={namesMasked} w={5}>
                          {c.handle}
                        </M>
                        {c.published.format.includes(' · ') && ` · ${c.published.format.split(' · ').slice(1).join(' · ')}`}
                      </span>
                    </span>
                    <span className="rm-published__views">
                      {c.id === top.id && <em>{room.t('top')}</em>}
                      <b className="rm-num">
                        <M on={numbersMasked}>{compact(c.published.views)}</M>
                      </b>
                      <ExternalLink size={11} />
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
