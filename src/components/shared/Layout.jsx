import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="page-content">
          <div className="perspective-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
