import { loginWithGoogle, registerWithGoogle } from '@/services/api';
import { saveSession } from '@/services/session';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

type Props = {
  mode: 'login' | 'register';
  disabled?: boolean;
};

type GoogleIdentity = {
  initialize: (options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (container: HTMLElement, options: {
    theme: 'outline'; size: 'large'; text: 'continue_with';
  }) => void;
};

type GoogleWindow = Window & {
  google?: { accounts?: { id?: GoogleIdentity } };
};

let googleScript: Promise<GoogleIdentity> | undefined;

function loadGoogleIdentity(): Promise<GoogleIdentity> {
  const ready = (window as GoogleWindow).google?.accounts?.id;
  if (ready) return Promise.resolve(ready);
  if (googleScript) return googleScript;

  googleScript = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const fail = () => {
      script.remove();
      reject(new Error('Layanan Google belum dapat dimuat. Periksa koneksi, lalu coba kembali.'));
    };
    script.onload = () => {
      const identity = (window as GoogleWindow).google?.accounts?.id;
      if (identity) resolve(identity);
      else fail();
    };
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    googleScript = undefined;
    throw error;
  });
  return googleScript;
}

export default function GoogleSignInButton({ disabled = false }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmation = useRef<((confirmed: boolean) => void) | null>(null);
  const dialogTitle = useId();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

  const finishConfirmation = useCallback((confirmed: boolean) => {
    const resolve = confirmation.current;
    confirmation.current = null;
    setPendingEmail(null);
    resolve?.(confirmed);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (pendingEmail && !dialog.open) dialog.showModal();
    else if (!pendingEmail && dialog.open) dialog.close();
  }, [pendingEmail]);

  useFocusEffect(useCallback(() => {
    const container = buttonRef.current;
    if (!container || disabled) return;
    let active = true;
    let submitting = false;
    setLoading(false);
    setMessage('');
    setPendingEmail(null);

    if (!clientId?.endsWith('.apps.googleusercontent.com')) {
      setMessage('Google Web Client ID belum dikonfigurasi pada aplikasi.');
      return;
    }

    async function handleCredential(credential?: string) {
      if (!active || submitting) return;
      if (!credential) {
        setMessage('Google ID Token tidak tersedia. Silakan pilih akun Google kembali.');
        return;
      }
      submitting = true;
      setLoading(true);
      setMessage('');
      try {
        let result = await loginWithGoogle(credential);
        if (!active) return;
        if (result?.success === true && result?.data?.requires_registration === true) {
          const email = result.data.email;
          if (typeof email !== 'string' || !email) {
            throw new Error('Email akun Google tidak tersedia. Silakan coba kembali.');
          }
          const confirmed = await new Promise<boolean>((resolve) => {
            confirmation.current = resolve;
            setPendingEmail(email);
          });
          if (!confirmed || !active) return;
          result = await registerWithGoogle(credential);
          if (!active) return;
        }
        if (result?.success !== true) {
          throw new Error(typeof result?.message === 'string' ? result.message : 'Login Google gagal.');
        }
        const access = result?.data?.access;
        const refresh = result?.data?.refresh;
        if (typeof access !== 'string' || !access || typeof refresh !== 'string' || !refresh) {
          throw new Error('Token sesi Curhat.in tidak tersedia.');
        }
        await saveSession(access, refresh);
        if (active) router.replace('/home');
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : 'Login Google gagal. Silakan coba kembali.');
      } finally {
        submitting = false;
        if (active) setLoading(false);
      }
    }

    void loadGoogleIdentity().then((identity) => {
      if (!active) return;
      identity.initialize({
        client_id: clientId,
        callback: ({ credential }) => { void handleCredential(credential); },
      });
      identity.renderButton(container, { theme: 'outline', size: 'large', text: 'continue_with' });
    }).catch((error: unknown) => {
      if (active) setMessage(error instanceof Error ? error.message : 'Layanan Google belum tersedia.');
    });

    return () => {
      active = false;
      const resolve = confirmation.current;
      confirmation.current = null;
      resolve?.(false);
      dialogRef.current?.close();
      container.replaceChildren();
    };
  }, [clientId, disabled]));

  return (
    <div style={{ marginTop: 18, textAlign: 'center' }}>
      <p style={{ color: '#817A89', fontSize: 13, marginBottom: 14 }}>atau</p>
      <div ref={buttonRef} style={{ display: disabled || loading ? 'none' : 'flex', justifyContent: 'center' }} />
      {loading && <p role="status">Menghubungkan ke Curhat.in...</p>}
      {message && <p role="alert" style={{ color: '#B42318' }}>{message}</p>}
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitle}
        onCancel={(event) => { event.preventDefault(); finishConfirmation(false); }}
        onClose={() => { if (confirmation.current) finishConfirmation(false); }}
        style={{ border: '1px solid #E5D9EF', borderRadius: 20, padding: 24, maxWidth: 400, width: 'calc(100% - 64px)', color: '#37323E', textAlign: 'left' }}
      >
        <form onSubmit={(event) => { event.preventDefault(); finishConfirmation(true); }}>
          <h2 id={dialogTitle} style={{ marginTop: 0 }}>Buat akun Curhat.in?</h2>
          <p style={{ overflowWrap: 'anywhere', lineHeight: 1.6 }}>
            Akun Google <strong>{pendingEmail}</strong> belum terdaftar di Curhat.in.
            {' '}Lanjutkan daftar sebagai akun baru?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={() => finishConfirmation(false)} style={{ border: '1px solid #8067B7', borderRadius: 12, padding: '12px 16px', background: '#FFFFFF', color: '#8067B7', cursor: 'pointer' }}>Batal</button>
            <button type="submit" style={{ border: '1px solid #8067B7', borderRadius: 12, padding: '12px 16px', background: '#8067B7', color: '#FFFFFF', cursor: 'pointer' }}>Daftar dan Lanjutkan</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
