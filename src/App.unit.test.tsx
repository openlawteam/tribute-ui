import {screen, render, waitFor} from '@testing-library/react';
import {useHistory} from 'react-router-dom';

import App from './App';
import Wrapper from './test/Wrapper';

describe('App unit tests', () => {
  test('can render index page', async () => {
    render(
      <Wrapper>
        <App />
      </Wrapper>
    );

    await waitFor(() => {
      // Header for get started
      expect(screen.getByTestId(/get-started-header/)).toBeInTheDocument();
      // Burger icon
      expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
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

  test("can render `renderMainContent` instead of a <Route />'s content", async () => {
    function RenderToGovernance() {
      const history = useHistory();
      history.push('/governance');

      return <App renderMainContent={() => <p>So cool!</p>} />;
    }

    render(
      <Wrapper>
        <RenderToGovernance />
      </Wrapper>
    );

    await waitFor(() => {
      // Logo
      expect(screen.getByText(/TRIBUTE/)).toBeInTheDocument();
      // Burger icon
      expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
      // Exposed nav menu
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      // Connect button
      expect(
        screen.getByRole('button', {name: /connect/i})
      ).toBeInTheDocument();

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
      <Wrapper>
        <CrappyPage />
      </Wrapper>
    );

    await waitFor(() => {
      // Logo
      expect(screen.getByText(/TRIBUTE/)).toBeInTheDocument();
      // Burger icon
      expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
      // Connect button
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
