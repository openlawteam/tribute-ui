import {Link, useLocation} from 'react-router-dom';

import {LeftLogo} from './logo';
import Nav from './Nav';

export default function Header() {
  /**
   * Their hooks
   */

  const location = useLocation();

  /**
   * Variables
   */

  const isIndexPath = location.pathname === '/';

  /**
   * Functions
   */

  // Render the location with a link
  function RenderLogo(props: React.PropsWithChildren<any>) {
    return <Link to="/">{props.children}</Link>;
  }

  /**
   * Render
   */

  // Don't display header if we're on the index page
  if (isIndexPath) return null;

  return (
    <header className="header">
      <RenderLogo>
        <LeftLogo />
      </RenderLogo>

      <div className="header__nav-container">
        <Nav />
      </div>
    </header>
  );
}
