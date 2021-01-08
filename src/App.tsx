import React from 'react';
import {Helmet} from 'react-helmet';

import Footer from './components/Footer';
import Header from './components/Header';
import Routes from './Routes';

export default function App() {
  return (
    <>
      {/** REACT HELMET */}
      <Helmet>
        <title>TRIBUTE dao</title>
        <meta
          name="description"
          content="A modular DAO framework developed and coordinated by its members"
        />
      </Helmet>

      {/** HEADER */}
      <Header />

      <main>
        <Routes />
      </main>

      {/** FOOTER */}
      <Footer />
    </>
  );
}
