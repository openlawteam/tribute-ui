import {render, screen} from '@testing-library/react';

import PreviewInputMarkdown from './PreviewInputMarkdown';

describe('PreviewInputMarkdown unit tests', () => {
  test('should render value as markdown', () => {
    render(
      <PreviewInputMarkdown value={'# Title\n##Sub-title\n- Bullet point'} />
    );

    expect(screen.getByText(/preview markdown/i)).toBeInTheDocument();
    expect(screen.getByText(/^title/i)).toBeInTheDocument();
    expect(screen.getByText(/^sub-title/i)).toBeInTheDocument();
    expect(screen.getByText(/^bullet point/i)).toBeInTheDocument();
  });

  test('should render null if no value', () => {
    render(<PreviewInputMarkdown value="" />);

    expect(() => screen.getByText(/preview markdown/i)).toThrow();
  });
});
