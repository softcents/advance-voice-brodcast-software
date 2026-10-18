'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Globe,
  Upload,
  Check,
  Eye,
  ShieldCheck,
  Mail,
  Phone,
  Layers,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/api';

export default function ResellerBrandingPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customDomain: '',
    brandName: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    supportEmail: '',
    supportPhone: '',
    footerText: '',
  });

  useEffect(() => {
    const fetchBranding = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/resellers/branding', {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setFormData({
              customDomain: data.customDomain || '',
              brandName: data.brandName || '',
              logoUrl: data.logoUrl || '',
              faviconUrl: data.faviconUrl || '',
              primaryColor: data.primaryColor || '#2563eb',
              secondaryColor: data.secondaryColor || '#1e40af',
              supportEmail: data.supportEmail || '',
              supportPhone: data.supportPhone || '',
              footerText: data.footerText || '',
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchBranding();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/resellers/branding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage('✅ White-label branding saved successfully!');
      } else {
        const err = await res.json();
        setMessage(`❌ Error: ${err.message || 'Failed to update branding'}`);
      }
    } catch (e: any) {
      setMessage(`❌ Network Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Palette className="w-7 h-7 text-blue-400" />
          White-Label Portal & Branding
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Customize your customer portal with your own logo, custom domain, primary colors, and support contacts.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.startsWith('✅')
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
              Loading branding settings...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Custom Domain
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. voice.mycompany.com"
                      value={formData.customDomain}
                      onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Point a CNAME record to <code className="text-gray-400">vsms.ominaz.com</code>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Brand / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Voice Solutions"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    value={formData.faviconUrl}
                    onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Theme Colors */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-950 border border-gray-800/80 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-28 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-gray-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-28 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs text-gray-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Support Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Support Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="support@mycompany.com"
                      value={formData.supportEmail}
                      onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Support Phone / Helpline
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="+880 1700-000000"
                      value={formData.supportPhone}
                      onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Footer Copyright Text
                </label>
                <input
                  type="text"
                  placeholder="© 2026 Apex Voice Solutions. All rights reserved."
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Branding Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-blue-400" /> Live Portal Preview
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {formData.brandName ? formData.brandName[0]?.toUpperCase() : 'V'}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white">{formData.brandName || 'Your Brand Name'}</div>
                <div className="text-[11px] text-gray-400 font-mono">
                  {formData.customDomain || 'vsms.yourdomain.com'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-950 rounded-xl space-y-2 text-xs">
              <div className="text-gray-400 text-[11px]">Primary Button Sample:</div>
              <button
                type="button"
                className="w-full py-2 rounded-lg text-white font-medium text-xs shadow transition"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Launch Voice Campaign
              </button>
            </div>

            <div className="text-[11px] text-gray-400 space-y-1">
              <div>Support: {formData.supportEmail || 'support@brand.com'}</div>
              <div>Helpline: {formData.supportPhone || '+880 1700-000000'}</div>
            </div>

            <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-800">
              {formData.footerText || '© 2026 Your Company. Powered by Voice Broadcast Pro.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
