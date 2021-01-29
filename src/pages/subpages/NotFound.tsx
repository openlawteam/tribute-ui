import React from 'react';

import Wrap from '../../components/common/Wrap';
import FadeIn from '../../components/common/FadeIn';

export default function NotFound() {
  return (
    <Wrap className="section-wrapper">
      <FadeIn>
        <div style={{textAlign: 'center', fontSize: '5rem'}}>
          <h3>
            4
            <span
              className="pulse"
              role="img"
              aria-label="404, not found"
              style={{display: 'inline-block'}}>
              😵
            </span>
            4
          </h3>
        </div>
      </FadeIn>
    </Wrap>
  );
}
