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

  const mainContent: React.ReactNode = (
    <main>{renderMainContent ? renderMainContent() : <Routes />}</main>
  );

  /**
   * Functions
   */

  function renderContent() {
    // The index path has its own template
    if (location.pathname === '/') {
      return <>{mainContent}</>;
    }

    // Render default template
    return (
      <>
        <Header />
        {mainContent}
        <Footer />
      </>
    );
  }

  /**
   * Render
   */

  return (
    <>
      {/* HEAD (react-helmet) */}
      <Head />

      {/* CONTENT */}
      {renderContent()}
    </>
  );
}
