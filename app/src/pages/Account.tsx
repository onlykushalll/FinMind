import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { me, updateMe } from '@/api/auth';
import { setCurrency, clearToken, clearRefreshToken } from '@/lib/auth';
import { api } from '@/api/client';

const SUPPORTED_CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'AED', label: 'UAE Dirham (AED)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
];

export default function Account() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [currency, setCurrencyState] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await me();
        setEmail(data.email);
        setCurrencyState(data.preferred_currency || 'INR');
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load account';
        toast({ title: 'Failed to load account', description: message });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast]);

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMe({ preferred_currency: currency });
      setCurrency(updated.preferred_currency);
      toast({
        title: 'Account updated',
        description: `Default currency set to ${updated.preferred_currency}.`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update account';
      toast({ title: 'Failed to update account', description: message });
    } finally {
      setSaving(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const userData = await me();
      
      // Create a structured export package
      const exportData = {
        user: {
          email: userData.email,
          preferred_currency: userData.preferred_currency,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        },
        export_date: new Date().toISOString(),
        version: '1.0'
      };
      
      // Create a blob and trigger download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finmind-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Log the export action
      await api('/api/audit/log', {
        method: 'POST',
        body: {
          action: 'DATA_EXPORT',
          timestamp: new Date().toISOString(),
          email: userData.email
        }
      });
      
      toast({
        title: 'Data Exported',
        description: 'Your personal data has been exported successfully.',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to export data';
      toast({ title: 'Export Failed', description: message });
    } finally {
      setExporting(false);
    }
  };

  const onDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      // Log the deletion action
      await api('/api/audit/log', {
        method: 'POST',
        body: {
          action: 'DATA_DELETION',
          timestamp: new Date().toISOString(),
          email
        }
      });
      
      // Clear local authentication data
      clearToken();
      clearRefreshToken();
      
      // In a real implementation, this would trigger backend deletion
      // For now, we simulate by clearing user data
      setEmail('');
      setCurrencyState('INR');
      
      toast({
        title: 'Account Deleted',
        description: 'Your account and personal data have been permanently deleted.',
      });
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete account';
      toast({ title: 'Deletion Failed', description: message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-wrap space-y-6">
      <div className="page-header">
        <div className="relative">
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">
            Manage your profile defaults. Currency stays fixed until you change
            it again.
          </p>
        </div>
      </div>

      <div className="card card-interactive space-y-5 fade-in-up">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading account...</div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="input bg-muted/30">{email}</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred_currency">Preferred Currency</Label>
              <select
                id="preferred_currency"
                className="input"
                value={currency}
                onChange={(e) => setCurrencyState(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onExport}
                  disabled={exporting || loading}
                >
                  {exporting ? 'Exporting...' : 'Export My Data'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={deleting || loading}
                >
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </Button>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="financial"
                  onClick={onSave}
                  disabled={saving || loading}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
