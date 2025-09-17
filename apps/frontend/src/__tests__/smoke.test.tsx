import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

test('renders shell and home cards', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText(/Marketing Hub/i)).toBeInTheDocument()
})

