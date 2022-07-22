import {Helmet} from 'react-helmet';

export default function Head() {
  return (
    <Helmet>
      <title>CineCapsule</title>
      <meta
        name="description"
        content="A modular DAO framework developed and coordinated by its members"
      />
    </Helmet>
  );
}
