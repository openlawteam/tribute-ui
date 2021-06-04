import Footer from './components/Footer';
import Header from './components/Header';
import Head from './Head';
import Routes from './Routes';

type AppProps = {
  /**
   * Optionally provide a component to render for the main content.
   */
  renderMainContent?: () => React.ReactNode;
};

export default function App(props?: AppProps) {
  const {renderMainContent} = props || {};

  const mainContent: React.ReactNode = renderMainContent ? (
    renderMainContent()
  ) : (
    <Routes />
  );

  return (
    <>
      {/* HEAD (react-helmet) */}
      <Head />

      {/* HEADER */}
      <Header />

      <main>{mainContent}</main>

      {/* FOOTER */}
      <Footer />
    </>
  );
}
