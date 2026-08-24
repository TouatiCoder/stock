'use client'

import { useCommonTranslations } from '@/components/LocaleProvider'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const t = useCommonTranslations()

  const calculateStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const strength = calculateStrength(password)
  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-500'
    if (strength === 2) return 'bg-yellow-500'
    if (strength === 3) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? getStrengthColor() : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <p className={strength >= 1 ? 'text-green-600' : ''}>
          {strength >= 1 ? '✓' : '○'} {t('passwordRequirementMinLength')}
        </p>
        <p className={strength >= 2 ? 'text-green-600' : ''}>
          {strength >= 2 ? '✓' : '○'} {t('passwordRequirementUppercase')}
        </p>
        <p className={strength >= 3 ? 'text-green-600' : ''}>
          {strength >= 3 ? '✓' : '○'} {t('passwordRequirementNumber')}
        </p>
        <p className={strength >= 4 ? 'text-green-600' : ''}>
          {strength >= 4 ? '✓' : '○'} {t('passwordRequirementSpecial')}
        </p>
      </div>
    </div>
  )
}
