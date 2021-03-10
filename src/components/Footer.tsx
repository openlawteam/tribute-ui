import {useLocation} from 'react-router-dom';

import SocialMedia from './common/SocialMedia';

export default function Footer() {
  /**
   * Their hooks
   */

  const location = useLocation();

  /**
   * Variables
   */

  const isIndexPath = location.pathname === '/';

  /**
   * Render
   */

  // Don't display footer if we're on the index page
  if (isIndexPath) return null;

  return (
    <div className="footer">
      <SocialMedia />
    </div>
  );
}
