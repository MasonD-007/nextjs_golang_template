import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../../app/page';

describe('HomePage', () => {
  it('renders the welcome page', () => {
    render(<HomePage />);
    
    expect(screen.getByText(/Next.js \+ Go/)).toBeInTheDocument();
    expect(screen.getByText(/Full-Stack Template/)).toBeInTheDocument();
    expect(screen.getByText(/View Demo/)).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<HomePage />);
    
    // Use getAllByText for text that appears multiple times
    const nextjsElements = screen.getAllByText(/Next.js/);
    expect(nextjsElements.length).toBeGreaterThanOrEqual(1);
    
    expect(screen.getByText('Go Backend')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
    
    // Check card descriptions
    expect(screen.getByText(/App Router, Server Components/)).toBeInTheDocument();
    expect(screen.getByText(/High-performance Go 1.26/)).toBeInTheDocument();
    expect(screen.getByText(/GitOps-ready with ArgoCD/)).toBeInTheDocument();
  });
});
