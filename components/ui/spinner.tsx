import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Spinner({
  className,
  label,
  ...props
}: React.ComponentProps<'svg'> & { label?: string }) {
  const ariaLabel = props['aria-label'] ?? label
  return (
    <Loader2Icon
      role="status"
      aria-label={ariaLabel}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
