import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, Copy, Rocket, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { launchProspect, PRESETS, prospect, shareLink, type PresetId } from '../../data/prospect';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';

function SetupInner() {
  const dispatch = useDispatch();
  const [name, setName] = useState(prospect.personalised ? prospect.name : '');
  const [preset, setPreset] = useState<PresetId>(prospect.preset);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const def = PRESETS.find((p) => p.id === preset)!;
  const link = shareLink(name, preset);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div className="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.base}>
      <div className="setup__backdrop" onClick={() => dispatch({ type: 'OVERLAY', overlay: null })} />
      <motion.form
        className="setup__box"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={t.slow}
        onSubmit={(e) => {
          e.preventDefault();
          launchProspect(name, preset);
        }}
      >
        <button type="button" className="roi__close" onClick={() => dispatch({ type: 'OVERLAY', overlay: null })} aria-label="Close">
          <X size={16} />
        </button>
        <div className="mono-sm t-acc">Prospect setup · 10 seconds</div>
        <h2 className="display setup__title">Who are you meeting?</h2>
        <p className="setup__lede t-2">
          The proposal, emails, documents and top bar will all carry their name.
        </p>

        <label className="setup__field">
          <span className="mono-sm t-3">Prospect name</span>
          <span className="setup__input">
            <Building2 size={15} className="t-3" />
            <input ref={inputRef} value={name} onChange={(e) => setName(e.target.value)} placeholder={def.defaultName} maxLength={40} />
          </span>
        </label>

        <div className="setup__field">
          <span className="mono-sm t-3">Industry preset</span>
          <div className="setup__presets">
            {PRESETS.map((p) => (
              <button type="button" key={p.id} className={`setup__preset ${p.id === preset ? 'is-on' : ''}`} onClick={() => setPreset(p.id)}>
                <span className="setup__preset-top">
                  <span>{p.label}</span>
                  {p.id === preset && <Check size={13} strokeWidth={2.6} className="t-acc" />}
                </span>
                <span className="setup__preset-blurb t-3">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="setup__field">
          <span className="mono-sm t-3">Or open this link before the meeting</span>
          <button type="button" className="setup__link mono-sm" onClick={copy}>
            <span className="setup__link-text">{link}</span>
            {copied ? <Check size={13} className="t-ok" /> : <Copy size={13} className="t-3" />}
          </button>
        </div>

        <div className="setup__actions">
          <button type="submit" className="btn btn--primary btn--lg">
            <Rocket size={14} /> Launch for {name.trim() || def.defaultName}
          </button>
          {prospect.personalised && (
            <button type="button" className="btn btn--ghost" onClick={() => launchProspect('', 'agency')}>
              <RotateCcw size={13} /> Reset to default
            </button>
          )}
        </div>
      </motion.form>
    </motion.div>
  );
}

export function ProspectSetup() {
  const { ui } = useAppState();
  return <AnimatePresence>{ui.overlay === 'setup' && <SetupInner key="setup" />}</AnimatePresence>;
}
