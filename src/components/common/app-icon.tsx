import Image from 'next/image'
import { cn } from '@/lib/shadcn/utils'
import appConfig from '@/config/app.config'
import { Link } from '@/lib/next-intl/navigation'

interface AppIconProps {
  /**
   * The height of the logo in pixels
   *
   * @default 40
   */
  height?: number
  /**
   * Whether to wrap the logo in a link to the homepage
   *
   * @default false
   */
  linked?: boolean
  /** Additional CSS classes to apply to the logo container */
  className?: string
  /** Additional CSS classes to apply to the image itself */
  imageClassName?: string
}

export const AppIcon = (props: AppIconProps) => {
  const { height = 40, linked = false, className, imageClassName } = props
  // Calculate width based on the original image aspect ratio (3.5:1)
  const width = Math.round(height * 3.5)

  const ImageComponent = (
    <div style={{ height: `${height}px` }} className="flex items-center">
      <Image
        // priority
        width={width}
        height={height}
        alt="Logo"
        src={appConfig.appLogo}
        style={{ maxHeight: `${height}px` }}
        className={cn('object-contain', imageClassName)}
      />
    </div>
  )

  if (linked) {
    return (
      <Link href="/" className={cn('flex items-center', className)}>
        {ImageComponent}
      </Link>
    )
  }

  return <div className={cn('flex items-center', className)}>{ImageComponent}</div>
}
