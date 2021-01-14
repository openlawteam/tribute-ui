import React from 'react';
import {screen, render, waitFor} from '@testing-library/react';
import {useHistory} from 'react-router-dom';

import App from './App';
import Wrapper from './test/Wrapper';

describe('App unit tests', () => {
  test('can render index page', async () => {
    render(
      <Wrapper useInit>
        <App />
      </Wrapper>
    );

    await waitFor(() => {
      // Header
      expect(screen.getByText(/TRIBUTE/)).toBeInTheDocument();
      // Subtitle
      expect(
        screen.getByText(/for the ongoing development of moloch v3/i)
      ).toBeInTheDocument();
      // Cube image
      expect(screen.getByTestId('cube')).toBeInTheDocument();
      // Join button
      expect(screen.getByRole('button', {name: /join/i})).toBeInTheDocument();
      // Navigation
      expect(screen.getByRole(/navigation/)).toBeInTheDocument();
    });
  });

  test('can navigate to 404 page on load', async () => {
    function CrappyPage() {
      const history = useHistory();
      history.push('/crappy/page');

      return <App />;
    }

    render(
      <Wrapper useInit>
        <CrappyPage />
      </Wrapper>
    );

    await waitFor(() => {
      // Header
      expect(screen.getByText(/TRIBUTE/)).toBeInTheDocument();
      // Burger icon
      expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', {name: /connect/i})
      ).toBeInTheDocument();
      // Exposed nav menu
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      // Content
      expect(screen.getByText(/4/)).toBeInTheDocument();
      expect(screen.getByText(/😵/i)).toBeInTheDocument();
      expect(screen.getByText(/4/)).toBeInTheDocument();
    });
  });
});
