/**
 * LoginPage Component
 * Login page with Authentik OIDC sign-in
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error, signIn, clearError } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSignIn = async () => {
    clearError();
    await signIn();
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md px-8 py-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">H</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bienvenue sur H-Board
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connectez-vous pour accéder à vos boards
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connexion en cours...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Se connecter avec SSO
            </>
          )}
        </button>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Authentification sécurisée par Authentik
        </p>
      </div>
    </div>
  );
}
