import { LayoutGroup, MotionConfig } from 'framer-motion';
import { BootSequence } from './features/boot/BootSequence';
import { IntegrationDrawer } from './features/integrations/IntegrationDrawer';
import { DeliverableViewer } from './features/outputs/DeliverableViewer';
import { OutputTray } from './features/outputs/OutputTray';
import { CommandPalette } from './features/overlays/CommandPalette';
import { MorningCard } from './features/overlays/MorningCard';
import { ProspectSetup } from './features/overlays/ProspectSetup';
import { RoiScreen } from './features/overlays/RoiScreen';
import { PresenterHUD } from './features/presenter/PresenterHUD';
import { ControlRoom } from './features/room/ControlRoom';
import { ActivityLedger } from './features/shell/ActivityLedger';
import { TopBar } from './features/shell/TopBar';
import { SignalRail } from './features/signals/SignalRail';
import { OperatingStage } from './features/stage/OperatingStage';
import { AppProvider, useAppState } from './state/AppProvider';

function Shell() {
  const { bootDone, ui } = useAppState();
  return (
    <div className={`stage ${bootDone ? 'is-live' : ''}`}>
      {bootDone && (
        <LayoutGroup>
          <TopBar />
          {ui.room && <ControlRoom />}
          <main className="grid" style={ui.room ? { display: 'none' } : undefined}>
            <SignalRail />
            <OperatingStage />
            <ActivityLedger />
            <OutputTray />
          </main>
          <DeliverableViewer />
          <IntegrationDrawer />
          <MorningCard />
          <RoiScreen />
          <ProspectSetup />
          <CommandPalette />
          <PresenterHUD />
        </LayoutGroup>
      )}
      <BootSequence />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <Shell />
      </AppProvider>
    </MotionConfig>
  );
}
