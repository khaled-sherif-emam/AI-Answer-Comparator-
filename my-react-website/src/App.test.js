import { render, screen } from '@testing-library/react';
import Chat from './Chat';

test('renders welcome message', () => {
  render(<Chat />);
  const welcomeElement = screen.getByText(/Welcome to Promptly/i);
  expect(welcomeElement).toBeInTheDocument();
});
