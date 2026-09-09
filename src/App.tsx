import { useRoute } from './lib/router'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Study } from './pages/Study'
import { StudyIndex } from './pages/StudyIndex'
import { Mock } from './pages/Mock'
import { Stories } from './pages/Stories'

export default function App() {
  const { segments } = useRoute()
  const section = segments[0] ?? ''

  let page
  if (section === '') page = <Dashboard />
  else if (section === 'study') page = segments[1] ? <Study /> : <StudyIndex />
  else if (section === 'mock') page = <Mock />
  else if (section === 'stories') page = <Stories />
  else page = <NotFound />

  return <Layout>{page}</Layout>
}

function NotFound() {
  return (
    <div className="px-6 py-24 text-center">
      <p className="text-lg font-semibold text-ink-900 dark:text-white">Không tìm thấy trang</p>
      <a href="#/" className="btn mt-4">
        Về trang chủ
      </a>
    </div>
  )
}
