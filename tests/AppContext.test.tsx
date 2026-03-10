import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';

// Mock mockApi dependency
vi.mock('../data/mockApi', () => ({
  addScanToProject: vi.fn().mockResolvedValue(undefined),
}));

const ReadContext: React.FC<{ onRender: (ctx: ReturnType<typeof useAppContext>) => void }> = ({ onRender }) => {
  const ctx = useAppContext();
  onRender(ctx);
  return null;
};

describe('AppContext', () => {
  it('provides default unauthenticated state', () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    expect(ctx!.isAuthenticated).toBe(false);
    expect(ctx!.currentUser).toBeNull();
    expect(ctx!.selectedProjectId).toBeNull();
    expect(ctx!.activeTab).toBe('dashboard');
  });

  it('hasPermission returns false when no user is set', () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    expect(ctx!.hasPermission('view_projects')).toBe(false);
  });

  it('setActiveTab updates the active tab', async () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    await act(async () => { ctx!.setActiveTab('billing'); });
    expect(ctx!.activeTab).toBe('billing');
  });

  it('updateSettings merges partial settings', async () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    await act(async () => {
      ctx!.updateSettings({ language: 'Spanish' });
    });
    expect(ctx!.settings.language).toBe('Spanish');
    // Other defaults preserved
    expect(ctx!.settings.dateFormat).toBe('Month/Day/Year');
  });

  it('SuperAdmin hasPermission always returns true', async () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    await act(async () => {
      ctx!.setCurrentUser({
        id: 'U-SUPER',
        email: 'super@test.com',
        name: 'Super Admin',
        role: 'SuperAdmin',
        companyId: 'SYSTEM',
        permissions: [],
      });
    });
    expect(ctx!.hasPermission('manage_users')).toBe(true);
    expect(ctx!.hasPermission('view_billing')).toBe(true);
    expect(ctx!.hasPermission('manage_billing')).toBe(true);
  });

  it('Technician hasPermission respects permissions array', async () => {
    let ctx: ReturnType<typeof useAppContext> | null = null;
    render(
      <AppProvider>
        <ReadContext onRender={c => { ctx = c; }} />
      </AppProvider>
    );
    await act(async () => {
      ctx!.setCurrentUser({
        id: 'U-TECH',
        email: 'tech@test.com',
        name: 'Technician',
        role: 'Technician',
        companyId: 'COMP-001',
        permissions: ['view_projects', 'edit_projects'],
      });
    });
    expect(ctx!.hasPermission('view_projects')).toBe(true);
    expect(ctx!.hasPermission('manage_users')).toBe(false);
  });

  it('throws when useAppContext is used outside AppProvider', () => {
    const Broken: React.FC = () => { useAppContext(); return null; };
    expect(() => render(<Broken />)).toThrow('useAppContext must be used within an AppProvider');
  });
});
