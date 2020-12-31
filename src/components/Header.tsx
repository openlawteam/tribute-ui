import React from 'react';
import {Link, useLocation} from 'react-router-dom';

import {LeftLogo} from './logo';
import Nav from './Nav';

export default function Header() {
  /**
   * Variables
   */

  const location = useLocation();
  const isIndexPath = location.pathname === '/';

  /**
   * Functions
   */

  // Render the location with or without a link depending on `location`
  function RenderLogo(props: React.PropsWithChildren<any>) {
    return isIndexPath ? props.children : <Link to="/">{props.children}</Link>;
  }

  return (
    <>
      <header className="header">
        <RenderLogo>
          <LeftLogo />
        </RenderLogo>

        <div className="header__nav-container">
          <Nav />
        </div>
      </header>
    </>
  );
}
