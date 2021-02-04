import React, {useEffect} from 'react';

import {useAdapters} from '../../hooks';

export default function AdapterManager() {
  const {adapters} = useAdapters();

  useEffect(() => {
    if (!adapters) return;
    console.log('adapters', adapters);
  }, [adapters]);

  return (
    <div>
      <h1>Adapter Manager</h1>
      <p>Below is a list of available adapters.</p>

      <div>
        <div>
          <span>Adapter Name</span>
          <span>Description</span>
        </div>

        <div>Version</div>

        <div>
          <button>Add</button>{' '}
          {/** @todo maybe modal popup to configure and add */}
        </div>

        <div>
          <button>Remove</button>{' '}
          {/** @todo maybe modal popup to configure and add */}
        </div>
      </div>

      <div>
        <div>
          <span>Adapter Name</span>
          <span>Description</span>
        </div>

        <div>Version</div>

        <div>
          <button>Add</button>{' '}
          {/** @todo maybe modal popup to configure and add */}
        </div>

        <div>
          <button>Remove</button>{' '}
          {/** @todo maybe modal popup to configure and add */}
        </div>
      </div>

      <div>
        <div>
          <span>Adapter Name</span>
          <span>Description</span>
        </div>

        <div>Version</div>

        <div>
          <button>Add/Update</button>{' '}
          {/** @todo maybe modal popup to configure and add/update
           *
           */}
        </div>

        <div>
          <button>Remove</button> {/** @todo window.confirm before removing */}
        </div>
      </div>
      <button>Finalize Dao</button>
    </div>
  );
}
