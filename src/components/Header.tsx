import {Link} from 'react-router-dom';

import {LeftLogo} from './logo';
import Nav from './Nav';

export default function Header() {
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
