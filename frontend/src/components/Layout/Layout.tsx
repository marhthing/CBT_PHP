import MobileLayout from './MobileLayout'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <MobileLayout>{children}</MobileLayout>
}