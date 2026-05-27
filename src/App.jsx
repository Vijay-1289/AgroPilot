import React from 'react';
import { useStageStore } from './store/stageStore';
import Layout from './components/common/Layout';

// Stage Pages imports
import Stage1Page from './pages/Stage1Page';
import Stage2Page from './pages/Stage2Page';
import Stage3Page from './pages/Stage3Page';
import Stage4Page from './pages/Stage4Page';
import Stage5Page from './pages/Stage5Page';
import Stage6Page from './pages/Stage6Page';
import Stage7Page from './pages/Stage7Page';
import Stage8Page from './pages/Stage8Page';
import Stage9Page from './pages/Stage9Page';
import Stage10Page from './pages/Stage10Page';

export default function App() {
  const { currentStage } = useStageStore();

  const renderStagePage = () => {
    switch (currentStage) {
      case 1:
        return <Stage1Page />;
      case 2:
        return <Stage2Page />;
      case 3:
        return <Stage3Page />;
      case 4:
        return <Stage4Page />;
      case 5:
        return <Stage5Page />;
      case 6:
        return <Stage6Page />;
      case 7:
        return <Stage7Page />;
      case 8:
        return <Stage8Page />;
      case 9:
        return <Stage9Page />;
      case 10:
        return <Stage10Page />;
      default:
        return <Stage1Page />;
    }
  };

  return (
    <Layout>
      {renderStagePage()}
    </Layout>
  );
}
