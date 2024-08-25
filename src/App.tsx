import { Provider } from 'mobx-react'
import './styles/index.less'
import store from './store'
import Index from '.'

export default function App() {
  return (
    <Provider store={store}>
      <Index />
    </Provider>
  )
}
