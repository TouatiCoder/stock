// components/invitation/activation-instructions.tsx
export function ActivationInstructions() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Instructions d'activation
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <ul className="list-disc pl-5 space-y-1">
              <li>Cliquez sur le lien d'invitation reçu par email</li>
              <li>Remplissez vos informations personnelles</li>
              <li>Créez un mot de passe sécurisé</li>
              <li>Validez la création de votre compte</li>
              <li>Téléchargez l'application mobile BuildStock Pro</li>
              <li>Connectez-vous avec votre email et mot de passe</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}