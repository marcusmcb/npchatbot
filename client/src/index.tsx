import ReactDOM from 'react-dom'
import App from './App'
import './index.css'
import { UserProvider } from './context/UserProvider'

console.log('window.electron in index.tsx:', window.electron)

ReactDOM.render(
	<UserProvider>
		<App />
	</UserProvider>,
	document.getElementById('root')
)

console.log('UserProvider mounted in index.tsx')
