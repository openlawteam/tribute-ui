import React from 'react';
import {Helmet} from 'react-helmet';

export default function Head() {
  return (
    <Helmet>
      <title>TRIBUTE dao</title>
      <meta
        name="description"
        content="A modular DAO framework developed and coordinated by its members"
      />
    </Helmet>
  );
}
