import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Mail, Key, Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function TwoFactorSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(null); // 'totp' or 'email'
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/2fa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async (method) => {
    setProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ method })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      setSetupMode(method);
      setSetupData(data);
      if (data.backup_codes) {
        setBackupCodes(data.backup_codes);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const verifySetup = async () => {
    if (!verifyCode || verifyCode.length < 6) {
      setError('Entrez un code à 6 chiffres');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: verifyCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      setSuccess('Double authentification activée !');
      if (data.backup_codes) {
        setBackupCodes(data.backup_codes);
      }
      setSetupMode(null);
      setSetupData(null);
      setVerifyCode('');
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword || !disableCode) {
      setError('Remplissez tous les champs');
      return;
    }
    
    setProcessing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: disablePassword, code: disableCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      
      setSuccess('Double authentification désactivée');
      setShowDisable(false);
      setDisablePassword('');
      setDisableCode('');
      fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(index);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setSuccess('Codes copiés !');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-800 to-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Double Authentification (2FA)</h3>
            <p className="text-sm text-slate-300">Sécurisez votre compte avec une vérification supplémentaire</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Status actuel */}
        {status?.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-green-800">2FA Activé</p>
                  <p className="text-sm text-green-600">
                    Méthode : {status.method === 'totp' ? 'Google Authenticator' : 'Email'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDisable(!showDisable)}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Désactiver
              </button>
            </div>

            {showDisable && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-4">
                <p className="text-sm text-red-700 font-medium">
                  Pour désactiver la 2FA, entrez votre mot de passe et un code de vérification :
                </p>
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Code 2FA ou code de secours"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  maxLength={8}
                />
                <div className="flex gap-2">
                  <button
                    onClick={disable2FA}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmer la désactivation'}
                  </button>
                  <button
                    onClick={() => setShowDisable(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {status.method === 'totp' && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Codes de secours restants :</strong> {status.backup_codes_remaining}
                </p>
              </div>
            )}
          </div>
        ) : setupMode ? (
          // Mode configuration
          <div className="space-y-6">
            {setupMode === 'totp' && setupData && (
              <>
                <div className="text-center space-y-4">
                  <h4 className="font-medium text-gray-800">Scannez ce QR code avec Google Authenticator</h4>
                  <div className="inline-block p-4 bg-white rounded-xl shadow-lg border">
                    <img src={setupData.qr_code} alt="QR Code" className="w-48 h-48" />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Ou entrez ce code manuellement :</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <code className="px-3 py-1 bg-gray-100 rounded font-mono text-sm">
                        {setupData.secret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(setupData.secret, 'secret')}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {copiedCode === 'secret' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Codes de secours */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-amber-800 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Codes de secours
                    </h5>
                    <button
                      onClick={copyAllCodes}
                      className="text-sm text-amber-700 hover:text-amber-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Tout copier
                    </button>
                  </div>
                  <p className="text-xs text-amber-700 mb-3">
                    Conservez ces codes en lieu sûr. Ils vous permettront de vous connecter si vous perdez accès à votre application.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded border">
                        <code className="font-mono text-sm">{code}</code>
                        <button
                          onClick={() => copyToClipboard(code, i)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {copiedCode === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {setupMode === 'email' && setupData && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Mail className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-medium text-blue-800">Code envoyé par email</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    Un code de vérification a été envoyé à votre adresse email.
                  </p>
                </div>
              </div>
            )}

            {/* Champ de vérification */}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Entrez le code à 6 chiffres"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-4 text-center text-2xl font-mono tracking-widest border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={6}
              />
              <div className="flex gap-3">
                <button
                  onClick={verifySetup}
                  disabled={processing || verifyCode.length < 6}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Vérifier et activer
                </button>
                <button
                  onClick={() => {
                    setSetupMode(null);
                    setSetupData(null);
                    setVerifyCode('');
                  }}
                  className="px-6 py-3 border rounded-xl hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Choix de la méthode
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Choisissez votre méthode de double authentification :
            </p>
            
            <button
              onClick={() => startSetup('totp')}
              disabled={processing}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition">
                  <Smartphone className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Google Authenticator</h4>
                  <p className="text-sm text-gray-500">Application sur téléphone (recommandé)</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Plus sécurisé
                </span>
              </div>
            </button>

            <button
              onClick={() => startSetup('email')}
              disabled={processing}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Code par Email</h4>
                  <p className="text-sm text-gray-500">Recevez un code à chaque connexion</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Simple
                </span>
              </div>
            </button>

            {processing && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
