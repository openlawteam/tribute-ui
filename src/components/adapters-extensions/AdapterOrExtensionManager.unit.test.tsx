import {render, screen, waitFor} from '@testing-library/react';

import AdapterOrExtensionManager from './AdapterOrExtensionManager';
import Wrapper from '../../test/Wrapper';

describe('AdapterOrExtensionManager unit tests', () => {
  test('should render dao manager', async () => {
    render(
      <Wrapper>
        <AdapterOrExtensionManager />
      </Wrapper>
    );

    expect(screen.getByText(/adapter\/extension manager/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /connect your wallet to manage the DAO adapters and extensions/i
      )
    ).toBeInTheDocument();
  });
});
