import {screen, render, waitFor} from '@testing-library/react';

import InitError from './InitError';

describe('InitError unit tests', () => {
  test('can render', async () => {
    render(<InitError error={new Error('Ahhhhh noooo!')} />);

    await waitFor(() => {
      expect(screen.getByText(/😵/i)).toBeInTheDocument();

      expect(
        screen.getByText(/oops, something went wrong\./i)
      ).toBeInTheDocument();

      expect(screen.getByText(/ahhhhh noooo!/i)).toBeInTheDocument();
    });
  });
});
