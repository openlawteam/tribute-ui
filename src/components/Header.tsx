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

  // Don't display header if we're on the index page
  if (isIndexPath) return null;

  // Render the location with a link
  function RenderLogo(props: React.PropsWithChildren<any>) {
    return <Link to="/">{props.children}</Link>;
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
