import React from 'react';

import Footer from './components/Footer';
import Header from './components/Header';
import Head from './Head';
import Routes from './Routes';

export default function App() {
  return (
    <>
      {/* HEAD (react-helmet) */}
      <Head />

      {/* HEADER */}
      <Header />

      <main>
        <Routes />
      </main>

      {/* FOOTER */}
      <Footer />
    </>
  );
}
