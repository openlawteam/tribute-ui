import {useLocation} from 'react-router-dom';

import Footer from './components/Footer';
import Head from './Head';
import Header from './components/Header';
import Routes from './Routes';

type AppProps = {
  /**
   * Optionally provide a component to render for the main content.
   */
  renderMainContent?: () => React.ReactNode;
};

export default function App(props?: AppProps) {
  /**
   * Their hooks
   */

  const location = useLocation();

  /**
   * Variables
   */

  const {renderMainContent} = props || {};
  const mainContent: React.ReactNode = renderMainContent ? (
    renderMainContent()
  ) : (
    <Routes />
  );

  function RenderIndexOrSubpage() {
    const mainComponent: React.ReactNode = <main>{mainContent}</main>;

    if (location.pathname === '/') {
      return <>{mainComponent}</>;
    }

    return (
      <>
        <Header />
        {mainComponent}
        <Footer />
      </>
    );
  }

  return (
    <>
      {/* HEAD (react-helmet) */}
      <Head />

      {/* CONTENT */}
      <RenderIndexOrSubpage />
    </>
  );
}
