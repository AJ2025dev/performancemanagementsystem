import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Home from '../pages/index';

describe('Home', () => {
  it('renders title', () => {
    render(<Home /> as any);
    expect(screen.getByText(/Affiliate & Media-Buy Platform/)).toBeInTheDocument();
  });
});
