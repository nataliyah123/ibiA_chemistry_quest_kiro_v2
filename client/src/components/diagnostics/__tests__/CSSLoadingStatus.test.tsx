/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CSSLoadingStatus from '../CSSLoadingStatus';

// Mock the CSS loading monitor
jest.mock('../../hooks/useCSSLoadingMonitor', () => ({
  useCSSLoadingMonitor: () => ({
    totalStylesheets: 2,
    loadedStylesheets: 1,
    failedStylesheets: 1,
    loadErrors: ['Failed to load: test.css'],
    hasErrors: true,
    isLoading: false,
    isComplete: false,
    loadingProgress: 50,
  }),
  useFailedStylesheets: () => ([
    {
      href: 'test.css',
      element: {} as HTMLLinkElement,
      loadStatus: 'error' as const,
      errorMessage: 'Failed to load stylesheet',
    }
  ]),
}));

describe('CSSLoadingStatus', () => {
  beforeEach(() => {
    // Clear any existing stylesheets
    document.head.innerHTML = '';
  });

  test('should render CSS loading status', () => {
    render(<CSSLoadingStatus />);
    
    expect(screen.getByText('CSS Loading Errors')).toBeInTheDocument();
    expect(screen.getByText('(1/2)')).toBeInTheDocument();
  });

  test('should show details when showDetails is true', () => {
    render(<CSSLoadingStatus showDetails={true} />);
    
    expect(screen.getByText('Failed Stylesheets:')).toBeInTheDocument();
    expect(screen.getByText('Summary:')).toBeInTheDocument();
    expect(screen.getByText('Total Stylesheets: 2')).toBeInTheDocument();
    expect(screen.getByText('Loaded: 1')).toBeInTheDocument();
    expect(screen.getByText('Failed: 1')).toBeInTheDocument();
  });

  test('should apply custom className', () => {
    const { container } = render(<CSSLoadingStatus className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('css-loading-status');
    expect(container.firstChild).toHaveClass('custom-class');
  });
});