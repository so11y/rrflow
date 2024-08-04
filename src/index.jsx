import { render } from 'solid-js/web'
import App from './app.jsx'
import 'virtual:uno.css'
import "./index.scss"

const root = document.getElementById('root')

render(() => <App />, root)
