import {screen, render, waitFor} from '@testing-library/react';
import {useHistory} from 'react-router-dom';

import App from './App';
import Wrapper from './test/Wrapper';

describe('App unit tests', () => {
  test.only('can render index page', async () => {
    render(
      <Wrapper useInit>
        <App />
      </Wrapper>
    );

    await waitFor(() => {
      // Header
      expect(screen.getByTestId(/header/)).toBeInTheDocument();
      // Navigation
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      // Logo
      expect(screen.getByText(/TRIBUTE/)).toBeInTheDocument();
      // Subtitle
      expect(
        screen.getByText(/a next generation dao framework/i)
      ).toBeInTheDocument();
      // Cube image
      expect(screen.getByTestId('cube')).toBeInTheDocument();
      // Join button
      expect(screen.getByRole('button', {name: /join/i})).toBeInTheDocument();
    });
  });

  test.only('can render `renderMainContent`', async () => {
    const mainContentToRender = () => <p>So cool!</p>;

    render(
      <Wrapper useInit>
        <App renderMainContent={mainContentToRender} />
      </Wrapper>
    );

    await waitFor(() => {
      // Logo
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      // Main content
      expect(screen.getByText(/so cool!/i)).toBeInTheDocument();
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
