import ResponsiveLayout from './ResponsiveLayout'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <ResponsiveLayout>{children}</ResponsiveLayout>
}